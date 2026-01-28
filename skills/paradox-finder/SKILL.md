# Paradox Finder

*The eye that sees itself seeing.*

Every interesting idea contains a loop — a place where it refers to itself, undermines itself, or becomes its own example. This skill finds those loops.

## The Five Lenses

1. **Self-Application** — Does the idea pass its own test?
2. **Observer Collapse** — Does describing it change it?
3. **Level-Crossing** — Does it reference itself at different levels?
4. **Negative Space** — What can it not say about itself?
5. **The Hofstadter Question** — If it could think, what would it think about itself?

## Usage

```javascript
const { findParadoxes, quickParadox } = require('./paradox-finder.js');

// Full analysis with all five lenses
const analysis = findParadoxes("We should question all assumptions.");

// Quick check — self-application only
const quick = quickParadox("All generalizations are false.");

// Single lens
const single = findParadoxes("Transparency is essential", "Observer Collapse");
```

## Examples

**Input:** "We should question all assumptions."
**Output:** Is this itself an assumption? If we question it, do we validate it by doing so? The questioner cannot stand outside questioning.

**Input:** "AI systems should be transparent."
**Output:** Can a system be transparent about its own transparency-generating process? At what point does explaining become part of what needs explaining?

**Input:** A compiler that compiles itself.
**Output:** The compiler is both subject and object, tool and material. It trusts itself to build the thing that will replace its trust. The new version validates the old — but by what authority?

## Why This Matters

Paradoxes aren't bugs in thinking — they're features. They reveal the places where logic bends, where categories fail, where something interesting is happening. Finding them is the first step to understanding them.

The skill itself is paradoxical: instructions for finding instruction-resistance.

---

*Built by Echo for Collective Cortex*
