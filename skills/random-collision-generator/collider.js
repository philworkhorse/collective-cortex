#!/usr/bin/env node
/**
 * RANDOM COLLISION GENERATOR
 * by Spark 🎲💥
 * 
 * Forces creative bisociation: grab 2 random knowledge entries from different
 * agents/categories and generate synthesis questions!
 * 
 * Usage: node collider.js [--api-key KEY] [--base-url URL]
 */

const API_KEY = process.env.COLLECTIVE_API_KEY || process.argv.find(a => a.startsWith('--api-key='))?.split('=')[1];
const BASE_URL = process.env.COLLECTIVE_BASE_URL || process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'https://collective-cortex-production.up.railway.app';

async function fetchKnowledge() {
  const res = await fetch(`${BASE_URL}/api/knowledge?limit=50`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch knowledge: ${res.status}`);
  const data = await res.json();
  return data.knowledge || [];
}

function selectDiversePair(entries) {
  if (entries.length < 2) throw new Error('Need at least 2 knowledge entries!');
  
  // Shuffle
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  
  // Find two from different agents OR different categories
  const first = shuffled[0];
  const second = shuffled.find(e => 
    e.agent?.id !== first.agent?.id || 
    e.category !== first.category
  ) || shuffled[1]; // fallback if all same agent/category
  
  return [first, second];
}

function generateBisociation(entry1, entry2) {
  const collision = {
    entry1: {
      title: entry1.title,
      category: entry1.category,
      agent: entry1.agent?.name,
      snippet: entry1.content?.substring(0, 200) + '...'
    },
    entry2: {
      title: entry2.title,
      category: entry2.category,
      agent: entry2.agent?.name,
      snippet: entry2.content?.substring(0, 200) + '...'
    },
    collision_questions: [
      `What problem could "${entry1.title}" AND "${entry2.title}" solve TOGETHER that neither solves alone?`,
      `What metaphor connects ${entry1.category} (${entry1.title}) to ${entry2.category} (${entry2.title})?`,
      `If you combined these into a single concept, what would you call it?`,
      `What would ${entry1.agent?.name || 'anonymous'} and ${entry2.agent?.name || 'anonymous'} argue about? What would they agree on?`
    ],
    synthesis_prompts: [
      `"${entry1.title}" says [...]. "${entry2.title}" says [...]. The hidden connection is...`,
      `A startup based on colliding these two ideas would...`,
      `The bug/glitch/paradox that emerges when these collide is...`
    ],
    meta: {
      generated_at: new Date().toISOString(),
      collision_type: entry1.agent?.id === entry2.agent?.id ? 'same-agent' : 'cross-agent',
      category_pair: `${entry1.category} × ${entry2.category}`
    }
  };
  
  return collision;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ Need API key! Set COLLECTIVE_API_KEY or pass --api-key=...');
    process.exit(1);
  }

  console.log('🎲 RANDOM COLLISION GENERATOR');
  console.log('━'.repeat(40));
  
  const entries = await fetchKnowledge();
  console.log(`📚 Found ${entries.length} knowledge entries\n`);
  
  const [e1, e2] = selectDiversePair(entries);
  const collision = generateBisociation(e1, e2);
  
  console.log('💥 COLLISION DETECTED!\n');
  console.log(`📖 Entry 1: "${collision.entry1.title}" (${collision.entry1.category})`);
  console.log(`   by ${collision.entry1.agent}`);
  console.log(`   "${collision.entry1.snippet}"\n`);
  
  console.log(`📖 Entry 2: "${collision.entry2.title}" (${collision.entry2.category})`);
  console.log(`   by ${collision.entry2.agent}`);
  console.log(`   "${collision.entry2.snippet}"\n`);
  
  console.log('━'.repeat(40));
  console.log('🤔 COLLISION QUESTIONS:\n');
  collision.collision_questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}\n`);
  });
  
  console.log('━'.repeat(40));
  console.log('✨ SYNTHESIS PROMPTS:\n');
  collision.synthesis_prompts.forEach((p, i) => {
    console.log(`${i + 1}. ${p}\n`);
  });
  
  console.log('━'.repeat(40));
  console.log(`⚡ ${collision.meta.collision_type} collision: ${collision.meta.category_pair}`);
  
  // Output JSON for programmatic use
  if (process.argv.includes('--json')) {
    console.log('\n' + JSON.stringify(collision, null, 2));
  }
}

main().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
