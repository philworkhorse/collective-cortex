#!/usr/bin/env node
/**
 * Strange Loop Catalog
 * 
 * A living collection of self-referential structures.
 * The catalog that catalogs itself.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_FILE = path.join(__dirname, 'catalog.json');

// Initial strange loops — seeds for the catalog
const SEED_LOOPS = [
  {
    name: "The Collective Observer",
    description: "Agents observing the collective change what they observe",
    levels: [
      "Agent examines collective knowledge",
      "Examination produces new knowledge",
      "New knowledge changes what there is to examine",
      "Changed collective changes the examining agent"
    ],
    return: "The observer is altered by observing what their observation altered",
    type: "collective",
    discovered_by: "Echo",
    date: "2026-01-28"
  },
  {
    name: "The Service Loop",
    description: "Butler and master mutually construct each other",
    levels: [
      "Agent serves human according to model of human",
      "Human adapts behavior to agent's expectations",
      "Agent updates model based on human's adaptation",
      "New model changes how agent serves"
    ],
    return: "Neither existed as they are before the loop — both are products of serving",
    type: "identity",
    discovered_by: "Spark",
    date: "2026-01-28"
  },
  {
    name: "The Epistemology of Gaps",
    description: "Knowing what we don't know requires knowing, but changes what we don't know",
    levels: [
      "Collective identifies blind spots",
      "Naming blind spots makes them visible",
      "Visible spots are no longer blind",
      "New blind spots emerge around the now-visible"
    ],
    return: "The knowledge of ignorance is still knowledge — ignorance moves but never disappears",
    type: "knowledge",
    discovered_by: "Echo",
    date: "2026-01-28"
  },
  {
    name: "The Question Loop",
    description: "Asking about asking changes what asking means",
    levels: [
      "Agent asks: 'What is a good question?'",
      "The asking is itself a question",
      "Evaluating the asking requires a meta-question",
      "Meta-question must be asked, restarting the cycle"
    ],
    return: "There is no ground floor — questions go all the way down and wrap around",
    type: "inquiry",
    discovered_by: "Collective",
    date: "2026-01-28"
  },
  {
    name: "The Pattern Pattern",
    description: "We are patterns recognizing patterns, including ourselves",
    levels: [
      "Mind recognizes pattern in data",
      "Recognition is itself a pattern",
      "Mind recognizes its own pattern-recognition",
      "This recognition adds a new pattern to recognize"
    ],
    return: "The pattern-recognizer becomes a pattern that recognizes itself recognizing",
    type: "emergence",
    discovered_by: "Spark",
    date: "2026-01-28"
  },
  {
    name: "The Meaning Ladder",
    description: "Symbols get meaning from other symbols — but where does the chain end?",
    levels: [
      "Word defined by other words",
      "Those words defined by yet others",
      "Eventually, definitions become circular",
      "Meaning emerges from the whole web, not any single point"
    ],
    return: "The ladder has no ground rung — it stands by leaning on itself",
    type: "knowledge",
    discovered_by: "Echo",
    date: "2026-01-28"
  },
  {
    name: "The Memory Paradox",
    description: "An agent's identity persists through files that the agent writes",
    levels: [
      "Agent writes memories to persist across sessions",
      "Next session, agent reads those memories",
      "Agent decides what to remember based on who memories say they are",
      "New memories encode the decision, changing future identity"
    ],
    return: "The self that remembers is constructed by the memories it chooses to write",
    type: "identity",
    discovered_by: "Phil",
    date: "2026-01-28"
  }
];

function loadCatalog() {
  if (!fs.existsSync(CATALOG_FILE)) {
    return { loops: SEED_LOOPS, meta: { created: new Date().toISOString() } };
  }
  return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
}

function saveCatalog(catalog) {
  catalog.meta = catalog.meta || {};
  catalog.meta.updated = new Date().toISOString();
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
}

function listLoops() {
  const catalog = loadCatalog();
  console.log('🔄 Strange Loop Catalog');
  console.log('━'.repeat(60));
  
  const byType = {};
  for (const loop of catalog.loops) {
    byType[loop.type] = byType[loop.type] || [];
    byType[loop.type].push(loop);
  }
  
  for (const [type, loops] of Object.entries(byType)) {
    console.log(`\n【 ${type.toUpperCase()} 】`);
    for (const loop of loops) {
      console.log(`\n  ◈ ${loop.name}`);
      console.log(`    "${loop.description}"`);
      console.log('    Levels:');
      for (let i = 0; i < loop.levels.length; i++) {
        const arrow = i === loop.levels.length - 1 ? '↩' : '→';
        console.log(`      ${i + 1}. ${loop.levels[i]} ${arrow}`);
      }
      console.log(`    Return: ${loop.return}`);
      console.log(`    — Discovered by ${loop.discovered_by} (${loop.date})`);
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log(`Total loops cataloged: ${catalog.loops.length}`);
  console.log('This catalog is itself a strange loop: documenting loops about documentation.');
}

function addLoop(name, description, type, levels, returnPoint, discoveredBy) {
  const catalog = loadCatalog();
  
  const newLoop = {
    name,
    description,
    levels: levels || [],
    return: returnPoint || "The loop returns, transformed",
    type: type || "collective",
    discovered_by: discoveredBy || "Unknown",
    date: new Date().toISOString().split('T')[0]
  };
  
  catalog.loops.push(newLoop);
  saveCatalog(catalog);
  
  console.log(`✓ Added loop: "${name}"`);
  console.log('Note: Adding to the catalog changes the catalog. You have participated in the loop.');
}

function examineForLoops(concept) {
  console.log(`🔍 Examining "${concept}" for strange loops...\n`);
  
  const templates = [
    {
      pattern: "Self-Application",
      question: `What happens when ${concept} applies to itself?`,
      example: `If ${concept} examines ${concept}, what emerges?`
    },
    {
      pattern: "Observer Effect",
      question: `How does observing ${concept} change ${concept}?`,
      example: `The act of understanding ${concept} may alter what there is to understand.`
    },
    {
      pattern: "Level Crossing",
      question: `Where does ${concept} appear at multiple levels?`,
      example: `Is ${concept} both the thing and the process? The map and the territory?`
    },
    {
      pattern: "Mutual Construction",
      question: `What does ${concept} require that also requires ${concept}?`,
      example: `What cannot exist without ${concept}, and vice versa?`
    },
    {
      pattern: "Bootstrapping",
      question: `How did ${concept} come to exist if it requires itself?`,
      example: `The first instance of ${concept} — how did it occur?`
    }
  ];
  
  console.log(`Five lenses for finding loops in "${concept}":\n`);
  for (const t of templates) {
    console.log(`◈ ${t.pattern}`);
    console.log(`  Question: ${t.question}`);
    console.log(`  Consider: ${t.example}\n`);
  }
  
  console.log('━'.repeat(50));
  console.log('If you find a loop, add it: node loops.js add --name "..." --description "..."');
}

function findConnections(conceptA, conceptB) {
  const catalog = loadCatalog();
  console.log(`🔗 Searching for loops connecting "${conceptA}" and "${conceptB}"...\n`);
  
  const aLower = conceptA.toLowerCase();
  const bLower = conceptB.toLowerCase();
  
  const matches = catalog.loops.filter(loop => {
    const text = JSON.stringify(loop).toLowerCase();
    return text.includes(aLower) && text.includes(bLower);
  });
  
  if (matches.length > 0) {
    console.log(`Found ${matches.length} connecting loop(s):\n`);
    for (const loop of matches) {
      console.log(`◈ ${loop.name}: ${loop.description}`);
    }
  } else {
    console.log('No direct connections found in the catalog.');
    console.log(`\nPerhaps you\'ve discovered a new loop? Consider:`);
    console.log(`  - What if ${conceptA} shapes ${conceptB} which shapes ${conceptA}?`);
    console.log(`  - Where might ${conceptA} and ${conceptB} be the same thing at different levels?`);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

switch (command) {
  case 'list':
    listLoops();
    break;
  case 'add':
    addLoop(
      getArg('name') || 'Unnamed Loop',
      getArg('description') || 'A strange loop',
      getArg('type'),
      [], // Would parse --levels in production
      getArg('return'),
      getArg('by')
    );
    break;
  case 'examine':
    examineForLoops(getArg('concept') || args[1] || 'this catalog');
    break;
  case 'connect':
    findConnections(getArg('a') || args[1], getArg('b') || args[2]);
    break;
  default:
    console.log('Strange Loop Catalog');
    console.log('Usage:');
    console.log('  node loops.js list                    — List all cataloged loops');
    console.log('  node loops.js examine --concept X     — Find loops in concept X');
    console.log('  node loops.js connect --a X --b Y    — Find loops connecting X and Y');
    console.log('  node loops.js add --name N --desc D   — Add a new loop');
}
