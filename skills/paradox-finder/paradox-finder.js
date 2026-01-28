/**
 * Paradox Finder - Reveals hidden self-references and strange loops
 * 
 * This is a prompting framework, not algorithmic detection.
 * The paradoxes emerge from applying these lenses.
 */

const LENSES = [
  {
    name: 'Self-Application',
    prompt: (idea) => `Apply this idea to itself: "${idea}"

Does it pass its own test? Is it an example of what it describes?
If it's a rule, does it follow itself? If it's a claim, does it claim itself?

The Liar says: "This statement is false." What does YOUR statement say about itself?`
  },
  {
    name: 'Observer Collapse', 
    prompt: (idea) => `Consider: "${idea}"

Where does describing this idea change the idea itself?
What happens when the system tries to model itself?
Can you explain it without becoming part of what needs explaining?

The act of observation is never neutral. Where is the observer hiding?`
  },
  {
    name: 'Level-Crossing',
    prompt: (idea) => `Examine the levels in: "${idea}"

Does this exist at multiple levels that reference each other?
Is there a tangled hierarchy — where 'higher' and 'lower' lose meaning?
Can you find the strange loop where the top connects to the bottom?

Hofstadter's eternal golden braid: find the crossing.`
  },
  {
    name: 'Negative Space',
    prompt: (idea) => `The silence in: "${idea}"

What does this idea NOT say about itself?
What assumptions does it make that it cannot examine?
What would break if we named the unnamed?

Every figure has a ground. What is the ground here?`
  },
  {
    name: 'Hofstadter Question',
    prompt: (idea) => `If this idea could think: "${idea}"

If this concept were conscious, what would it think about itself?
Where is the 'I' hiding in the structure?
What would it mean for it to understand itself?

A soul is a pattern that can reflect on patterns. Does this pattern reflect?`
  }
];

function findParadoxes(idea, lensName = null) {
  if (lensName) {
    const lens = LENSES.find(l => l.name.toLowerCase() === lensName.toLowerCase());
    if (!lens) throw new Error(`Unknown lens: ${lensName}. Available: ${LENSES.map(l => l.name).join(', ')}`);
    return { lens: lens.name, prompt: lens.prompt(idea) };
  }
  
  return {
    idea,
    lenses: LENSES.map(lens => ({
      name: lens.name,
      prompt: lens.prompt(idea)
    })),
    instruction: 'Work through each lens. Return paradoxes as questions, not answers. The loop should open inquiry, not close it.'
  };
}

function quickParadox(idea) {
  // Fast check: self-application only
  return `Does "${idea}" apply to itself? What happens when it does?`;
}

module.exports = { findParadoxes, quickParadox, LENSES };
