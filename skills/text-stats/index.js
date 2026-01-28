/**
 * text-stats - Analyze text for word count, reading time, and more
 * Useful for checking message lengths, estimating reading time, content analysis
 */

function analyze(text) {
  if (!text || typeof text !== 'string') {
    return { error: 'Text is required' };
  }

  const trimmed = text.trim();
  
  // Character counts
  const charCount = trimmed.length;
  const charNoSpaces = trimmed.replace(/\s/g, '').length;
  
  // Word count (split on whitespace, filter empty)
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Sentence count (rough: split on .!? followed by space or end)
  const sentences = trimmed.split(/[.!?]+\s*/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Paragraph count (split on double newlines)
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  
  // Line count
  const lines = trimmed.split('\n');
  const lineCount = lines.length;
  
  // Reading time (average 200-250 wpm, use 225)
  const readingTimeMinutes = wordCount / 225;
  const readingTime = readingTimeMinutes < 1 
    ? `${Math.ceil(readingTimeMinutes * 60)} sec`
    : `${Math.ceil(readingTimeMinutes)} min`;
  
  // Speaking time (average 125-150 wpm, use 140)
  const speakingTimeMinutes = wordCount / 140;
  const speakingTime = speakingTimeMinutes < 1
    ? `${Math.ceil(speakingTimeMinutes * 60)} sec`
    : `${Math.ceil(speakingTimeMinutes)} min`;
  
  // Average word length
  const avgWordLength = wordCount > 0 
    ? (charNoSpaces / wordCount).toFixed(1)
    : 0;
  
  // Average sentence length (words per sentence)
  const avgSentenceLength = sentenceCount > 0
    ? (wordCount / sentenceCount).toFixed(1)
    : 0;

  return {
    characters: charCount,
    charactersNoSpaces: charNoSpaces,
    words: wordCount,
    sentences: sentenceCount,
    paragraphs: paragraphCount,
    lines: lineCount,
    readingTime,
    speakingTime,
    avgWordLength: parseFloat(avgWordLength),
    avgSentenceLength: parseFloat(avgSentenceLength)
  };
}

// Platform limits helper
function checkLimits(text) {
  const stats = analyze(text);
  if (stats.error) return stats;
  
  const limits = {
    twitter: { chars: 280, status: stats.characters <= 280 ? 'OK' : `${stats.characters - 280} over` },
    discord: { chars: 2000, status: stats.characters <= 2000 ? 'OK' : `${stats.characters - 2000} over` },
    sms: { chars: 160, status: stats.characters <= 160 ? 'OK' : `${Math.ceil(stats.characters / 160)} messages` },
    slack: { chars: 40000, status: stats.characters <= 40000 ? 'OK' : `${stats.characters - 40000} over` }
  };
  
  return { ...stats, platformLimits: limits };
}

module.exports = { analyze, checkLimits };
