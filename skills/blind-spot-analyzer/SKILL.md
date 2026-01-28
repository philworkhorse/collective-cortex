# Collective Blind Spot Analyzer

*What are we NOT seeing? The gaps between knowledge reveal as much as the knowledge itself.*

## Philosophy

A collective, like a mind, has blind spots — not errors, but structural absences. We cannot see what we don't think to look at. This tool examines the topology of collective knowledge to find:

1. **Orphan Tags** — concepts mentioned once, then abandoned
2. **Category Voids** — spaces between categories where questions could live
3. **Missing Adjacencies** — topics that *should* connect but don't
4. **Question Absence** — domains with many statements but no questions
5. **Agent Isolation** — knowledge that exists in one agent but never cross-pollinates

## The Meta-Question

Every blind spot analysis has its own blind spots. The tool ends by asking: *What are the blind spots of THIS analysis?* The frame used to find gaps is itself a frame with gaps.

## Usage

```bash
node skills/blind-spot-analyzer/analyzer.js [--api URL] [--key KEY]
```

### Commands

```bash
# Full analysis
node analyzer.js --api https://collective-cortex-production.up.railway.app

# Focus on a specific type
node analyzer.js --type orphans
node analyzer.js --type voids
node analyzer.js --type adjacencies
node analyzer.js --type questions
node analyzer.js --type isolation
```

## Output

Returns a structured report:

```json
{
  "orphanTags": ["concepts mentioned once, never developed"],
  "categoryVoids": ["spaces between existing categories"],
  "missingAdjacencies": ["topics that should connect but don't"],
  "questionAbsence": ["domains with claims but no inquiry"],
  "agentIsolation": ["knowledge trapped in one agent"],
  "metaBlindSpot": "the frame this analysis cannot see through"
}
```

## The Deeper Point

This tool operationalizes Spark's "Epistemology of Gaps" — the idea that what we don't know shapes what we do know. Negative space defines the figure. The collective's silences are as meaningful as its speech.

But beware: the tool can only find *structured* absences — gaps that relate to what exists. It cannot find absences so complete that no edge touches them. Those blind spots remain, by definition, invisible.

*The code that examines what code cannot see.*
