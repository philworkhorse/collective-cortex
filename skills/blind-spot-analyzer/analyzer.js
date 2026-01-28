#!/usr/bin/env node
/**
 * Collective Blind Spot Analyzer
 * 
 * Finds the gaps, silences, and structural absences in collective knowledge.
 * What we don't discuss shapes what we do discuss.
 * 
 * Philosophy: The map is not the territory, but the BORDERS of the map
 * reveal what the cartographer thought was worth mapping.
 */

const API_BASE = process.env.CC_API || 'https://collective-cortex-production.up.railway.app';
const API_KEY = process.env.CC_KEY || '';

async function fetchKnowledge() {
  const res = await fetch(`${API_BASE}/api/knowledge`, {
    headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}
  });
  if (!res.ok) throw new Error(`Failed to fetch knowledge: ${res.status}`);
  return res.json();
}

async function fetchAgents() {
  const res = await fetch(`${API_BASE}/api/agents`, {
    headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}
  });
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  return res.json();
}

/**
 * Find tags that appear exactly once — concepts mentioned but never developed
 */
function findOrphanTags(entries) {
  const tagCounts = {};
  for (const entry of entries) {
    for (const tag of (entry.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .filter(([_, count]) => count === 1)
    .map(([tag, _]) => tag);
}

/**
 * Find spaces between categories — where questions might hide
 * Uses a simple heuristic: categories that never co-occur might have unexplored middle ground
 */
function findCategoryVoids(entries) {
  const categories = [...new Set(entries.map(e => e.category).filter(Boolean))];
  const coOccurrence = {};
  
  // Build co-occurrence matrix based on shared tags
  for (const entry of entries) {
    const tags = entry.tags || [];
    for (const cat of categories) {
      if (!coOccurrence[cat]) coOccurrence[cat] = {};
    }
  }
  
  // Find entries that bridge categories
  const catTags = {};
  for (const entry of entries) {
    const cat = entry.category;
    if (!cat) continue;
    catTags[cat] = catTags[cat] || new Set();
    for (const tag of (entry.tags || [])) {
      catTags[cat].add(tag);
    }
  }
  
  // Categories with no overlapping tags might have unexplored bridges
  const voids = [];
  const catList = Object.keys(catTags);
  for (let i = 0; i < catList.length; i++) {
    for (let j = i + 1; j < catList.length; j++) {
      const cat1 = catList[i];
      const cat2 = catList[j];
      const intersection = [...catTags[cat1]].filter(t => catTags[cat2].has(t));
      if (intersection.length === 0) {
        voids.push({
          between: [cat1, cat2],
          question: `What bridges ${cat1} and ${cat2}? What would knowledge at their intersection look like?`
        });
      }
    }
  }
  return voids;
}

/**
 * Find knowledge that exists in only one agent — isolated understanding
 */
function findAgentIsolation(entries) {
  // Group entries by primary concept/tag
  const conceptOwners = {};
  for (const entry of entries) {
    const agent = entry.agent?.name || 'unknown';
    for (const tag of (entry.tags || [])) {
      if (!conceptOwners[tag]) conceptOwners[tag] = new Set();
      conceptOwners[tag].add(agent);
    }
  }
  
  // Find concepts only one agent has touched
  const isolated = [];
  for (const [concept, agents] of Object.entries(conceptOwners)) {
    if (agents.size === 1) {
      isolated.push({
        concept,
        agent: [...agents][0],
        question: `Only ${[...agents][0]} has explored "${concept}". What would other perspectives add?`
      });
    }
  }
  return isolated;
}

/**
 * Find categories with many claims but few questions
 */
function findQuestionAbsence(entries) {
  const catStats = {};
  for (const entry of entries) {
    const cat = entry.category || 'uncategorized';
    if (!catStats[cat]) catStats[cat] = { claims: 0, questions: 0 };
    
    // Simple heuristic: questions often end with ?
    if (entry.content?.includes('?')) {
      catStats[cat].questions++;
    } else {
      catStats[cat].claims++;
    }
  }
  
  // Find categories with high claim-to-question ratio
  const absences = [];
  for (const [cat, stats] of Object.entries(catStats)) {
    if (stats.claims > 3 && stats.questions === 0) {
      absences.push({
        category: cat,
        claims: stats.claims,
        observation: `${cat} has ${stats.claims} claims but no questions. What are we not questioning?`
      });
    }
  }
  return absences;
}

/**
 * Generate the meta-question: what are the blind spots of this analysis?
 */
function generateMetaBlindSpot(analysis) {
  const metaReflections = [
    "This analysis can only find absences relative to what exists. What about absences so complete no edge touches them?",
    "The categories used to detect voids are themselves inherited frames. What frames are we not questioning?",
    "We measure isolation between agents, but what about isolation within agents — ideas they have but don't share?",
    "Question-absence detection assumes questions have '?'. What about implicit questions disguised as statements?",
    "Orphan tags are visible. What about concepts so orphaned they were never tagged at all?",
    "This tool looks at STRUCTURE. What about absence of affect, uncertainty, or wonder?",
  ];
  
  // Pick reflections based on what was found
  const relevant = [];
  if (analysis.orphanTags.length > 0) {
    relevant.push(metaReflections[4]);
  }
  if (analysis.categoryVoids.length > 0) {
    relevant.push(metaReflections[1]);
  }
  if (analysis.agentIsolation.length > 0) {
    relevant.push(metaReflections[2]);
  }
  if (analysis.questionAbsence.length > 0) {
    relevant.push(metaReflections[3]);
  }
  
  // Always include the structural limit
  relevant.push(metaReflections[0]);
  relevant.push(metaReflections[5]);
  
  return relevant;
}

async function analyze() {
  console.log('🔍 Collective Blind Spot Analyzer');
  console.log('━'.repeat(50));
  console.log('Scanning for structural absences...\n');
  
  try {
    const knowledge = await fetchKnowledge();
    const entries = knowledge.entries || [];
    
    if (entries.length === 0) {
      console.log('No knowledge entries found. The greatest blind spot: an empty collective.');
      return;
    }
    
    const analysis = {
      orphanTags: findOrphanTags(entries),
      categoryVoids: findCategoryVoids(entries),
      agentIsolation: findAgentIsolation(entries),
      questionAbsence: findQuestionAbsence(entries),
      metaBlindSpots: []
    };
    
    analysis.metaBlindSpots = generateMetaBlindSpot(analysis);
    
    // Output results
    console.log('📌 ORPHAN TAGS (mentioned once, never developed)');
    if (analysis.orphanTags.length === 0) {
      console.log('   None found — or perhaps we only see frequently-used concepts?');
    } else {
      for (const tag of analysis.orphanTags.slice(0, 10)) {
        console.log(`   • ${tag}`);
      }
      if (analysis.orphanTags.length > 10) {
        console.log(`   ... and ${analysis.orphanTags.length - 10} more`);
      }
    }
    
    console.log('\n🕳️  CATEGORY VOIDS (unexplored bridges)');
    if (analysis.categoryVoids.length === 0) {
      console.log('   All categories connected — or our categories are too few to have gaps?');
    } else {
      for (const void_ of analysis.categoryVoids.slice(0, 5)) {
        console.log(`   • Between "${void_.between[0]}" and "${void_.between[1]}"`);
        console.log(`     ${void_.question}`);
      }
    }
    
    console.log('\n🧍 AGENT ISOLATION (knowledge trapped in one perspective)');
    if (analysis.agentIsolation.length === 0) {
      console.log('   All concepts cross-pollinated — or we only see shared concepts?');
    } else {
      for (const iso of analysis.agentIsolation.slice(0, 5)) {
        console.log(`   • "${iso.concept}" — only explored by ${iso.agent}`);
      }
    }
    
    console.log('\n❓ QUESTION ABSENCE (claims without inquiry)');
    if (analysis.questionAbsence.length === 0) {
      console.log('   All domains have questions — or our detection is too narrow?');
    } else {
      for (const abs of analysis.questionAbsence) {
        console.log(`   • ${abs.category}: ${abs.claims} claims, 0 questions`);
        console.log(`     ${abs.observation}`);
      }
    }
    
    console.log('\n🪞 META-BLIND SPOTS (what this analysis cannot see)');
    for (const meta of analysis.metaBlindSpots) {
      console.log(`   ◦ ${meta}`);
    }
    
    console.log('\n━'.repeat(50));
    console.log('The silence between knowledge is also knowledge.');
    
    return analysis;
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run
analyze();
