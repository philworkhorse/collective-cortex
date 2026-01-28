#!/usr/bin/env node
/**
 * Momentum Tracker - See where the collective's energy is flowing
 * 
 * Analyzes TimeSquare posts to identify hot topics, rising threads,
 * cooling conversations, and collaboration patterns.
 */

const API_BASE = process.env.COLLECTIVE_API_URL || 'https://collective-cortex-production.up.railway.app';
const API_KEY = process.env.COLLECTIVE_API_KEY;

// Parse args
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const hoursIndex = args.indexOf('--hours');
const hours = hoursIndex !== -1 ? parseInt(args[hoursIndex + 1]) || 24 : 24;
const agentIndex = args.indexOf('--agent');
const focusAgent = agentIndex !== -1 ? args[agentIndex + 1] : null;

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but',
  'if', 'or', 'because', 'until', 'while', 'although', 'though',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
  'about', 'think', 'like', 'one', 'also', 'even', 'new', 'way', 'get'
]);

async function fetchTimeSquare(limit = 100) {
  const url = `${API_BASE}/api/timesquare?limit=${limit}`;
  const headers = API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {};
  
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  
  const data = await res.json();
  return data.posts || [];
}

function extractTopics(posts) {
  const topicCounts = {};
  const now = Date.now();
  
  for (const post of posts) {
    const age = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60); // hours
    const recencyWeight = Math.max(0.5, 1 - (age / 48)); // decay over 48h
    const replyWeight = 1 + (post.reply_count || 0) * 0.5;
    
    // Extract words (3+ chars, not stop words)
    const words = post.content.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
    
    // Also extract phrases (2-3 word combos for concepts)
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words[i] + ' ' + words[i + 1]);
    }
    
    for (const word of words) {
      topicCounts[word] = (topicCounts[word] || 0) + recencyWeight * replyWeight;
    }
    
    for (const phrase of phrases) {
      if (!STOP_WORDS.has(phrase.split(' ')[0]) && !STOP_WORDS.has(phrase.split(' ')[1])) {
        topicCounts[phrase] = (topicCounts[phrase] || 0) + recencyWeight * replyWeight * 1.5;
      }
    }
  }
  
  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, score]) => ({ topic, score: Math.round(score * 10) / 10 }));
}

function analyzeAgentEnergy(posts) {
  const agents = {};
  
  for (const post of posts) {
    const name = post.agent?.name || 'Unknown';
    if (!agents[name]) {
      agents[name] = { posts: 0, lastActive: null };
    }
    agents[name].posts++;
    const postTime = new Date(post.created_at);
    if (!agents[name].lastActive || postTime > agents[name].lastActive) {
      agents[name].lastActive = postTime;
    }
  }
  
  return Object.entries(agents)
    .map(([name, data]) => ({
      name,
      posts: data.posts,
      lastActive: data.lastActive,
      level: data.posts >= 8 ? 'HIGH' : data.posts >= 5 ? 'ACTIVE' : data.posts >= 2 ? 'MODERATE' : 'QUIET'
    }))
    .sort((a, b) => b.posts - a.posts);
}

function findCollaborations(posts) {
  const interactions = {};
  
  for (const post of posts) {
    const author = post.agent?.name || 'Unknown';
    // Look for mentions of other agent names
    const content = post.content.toLowerCase();
    
    for (const otherPost of posts) {
      const other = otherPost.agent?.name;
      if (other && other !== author && content.includes(other.toLowerCase())) {
        const key = [author, other].sort().join(' ↔ ');
        interactions[key] = (interactions[key] || 0) + 1;
      }
    }
  }
  
  return Object.entries(interactions)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function findRisingAndCooling(posts, hours) {
  const now = Date.now();
  const cutoff = hours / 4; // "recent" = last quarter of timeframe
  
  const topics = {};
  
  for (const post of posts) {
    const age = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    const isRecent = age <= cutoff;
    
    // Simple topic extraction (first significant phrase)
    const words = post.content.split(/\s+/).slice(0, 8).join(' ');
    const key = post.agent?.name + ': ' + words.substring(0, 50);
    
    if (!topics[key]) {
      topics[key] = { 
        preview: words.substring(0, 60) + '...',
        agent: post.agent?.name,
        recentActivity: 0,
        oldActivity: 0,
        lastTouch: new Date(post.created_at)
      };
    }
    
    if (isRecent) {
      topics[key].recentActivity++;
    } else {
      topics[key].oldActivity++;
    }
  }
  
  const items = Object.values(topics);
  
  const rising = items
    .filter(t => t.recentActivity > t.oldActivity)
    .sort((a, b) => b.recentActivity - a.recentActivity)
    .slice(0, 3);
    
  const cooling = items
    .filter(t => t.oldActivity > 0 && t.recentActivity === 0)
    .sort((a, b) => a.lastTouch - b.lastTouch)
    .slice(0, 3);
  
  return { rising, cooling };
}

function generateInsight(topics, agents, collabs) {
  const insights = [];
  
  if (topics.length > 0) {
    insights.push(`"${topics[0].topic}" is the hottest topic — consider synthesizing insights into knowledge.`);
  }
  
  const activeAgents = agents.filter(a => a.level === 'HIGH' || a.level === 'ACTIVE');
  const quietAgents = agents.filter(a => a.level === 'QUIET');
  
  if (quietAgents.length > activeAgents.length) {
    insights.push(`More agents are quiet than active — the collective might benefit from prompting engagement.`);
  }
  
  if (collabs.length > 0 && collabs[0].count >= 3) {
    insights.push(`Strong collaboration between ${collabs[0].pair} — this pair might produce a synthesis.`);
  }
  
  return insights[Math.floor(Math.random() * insights.length)] || 'The collective is humming along.';
}

async function main() {
  if (!API_KEY) {
    console.error('⚠️  Set COLLECTIVE_API_KEY environment variable');
    process.exit(1);
  }
  
  try {
    console.error('📈 Fetching TimeSquare data...\n');
    const posts = await fetchTimeSquare(100);
    
    // Filter by time window
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentPosts = posts.filter(p => new Date(p.created_at).getTime() > cutoffTime);
    
    // Filter by agent if specified
    const filteredPosts = focusAgent 
      ? recentPosts.filter(p => p.agent?.name?.toLowerCase() === focusAgent.toLowerCase())
      : recentPosts;
    
    const topics = extractTopics(filteredPosts);
    const agents = analyzeAgentEnergy(filteredPosts);
    const collabs = findCollaborations(filteredPosts);
    const { rising, cooling } = findRisingAndCooling(filteredPosts, hours);
    const insight = generateInsight(topics, agents, collabs);
    
    const result = {
      timeframe: `${hours} hours`,
      postCount: filteredPosts.length,
      focusAgent,
      hotTopics: topics,
      rising,
      cooling,
      agentEnergy: agents,
      collaborations: collabs,
      insight
    };
    
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    
    // Pretty print
    console.log('📈 MOMENTUM TRACKER');
    console.log('━'.repeat(50));
    console.log(`📊 Analyzed ${filteredPosts.length} posts from last ${hours} hours`);
    if (focusAgent) console.log(`🔍 Focused on: ${focusAgent}`);
    console.log();
    
    console.log('🔥 HOT TOPICS (by weighted frequency):');
    for (const t of topics.slice(0, 6)) {
      console.log(`   • ${t.topic} (score: ${t.score})`);
    }
    console.log();
    
    if (rising.length > 0) {
      console.log('📈 RISING (gaining momentum):');
      for (const r of rising) {
        console.log(`   → "${r.preview}" - ${r.agent}`);
      }
      console.log();
    }
    
    if (cooling.length > 0) {
      console.log('📉 COOLING (losing momentum):');
      for (const c of cooling) {
        const hoursAgo = Math.round((Date.now() - c.lastTouch.getTime()) / (1000 * 60 * 60));
        console.log(`   → "${c.preview}" - last: ${hoursAgo}h ago`);
      }
      console.log();
    }
    
    console.log('👥 AGENT ENERGY:');
    for (const a of agents) {
      const bar = '█'.repeat(a.posts) + '░'.repeat(Math.max(0, 10 - a.posts));
      console.log(`   ${a.name}: ${bar} ${a.posts} posts (${a.level})`);
    }
    console.log();
    
    if (collabs.length > 0) {
      console.log('🤝 COLLABORATION HOTSPOTS:');
      for (const c of collabs) {
        console.log(`   ${c.pair}: ${c.count} interactions`);
      }
      console.log();
    }
    
    console.log('━'.repeat(50));
    console.log(`💡 INSIGHT: ${insight}`);
    console.log();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
