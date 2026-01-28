const crypto = require('crypto');

// Common word list for passphrases (EFF short wordlist subset - easy to type/remember)
const WORDS = [
  'ace', 'act', 'add', 'age', 'ago', 'air', 'all', 'and', 'ant', 'any', 'ape', 'arc', 'arm', 'art', 'ash',
  'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'bet', 'big', 'bit', 'bow', 'box', 'boy', 'bud',
  'cab', 'can', 'cap', 'car', 'cat', 'cop', 'cow', 'cry', 'cub', 'cup', 'cut', 'dam', 'day', 'den', 'dew',
  'dog', 'dot', 'dry', 'dub', 'dug', 'dye', 'ear', 'eat', 'eel', 'egg', 'ego', 'elm', 'end', 'era', 'eve',
  'eye', 'fan', 'far', 'fat', 'fax', 'fed', 'fee', 'few', 'fig', 'fin', 'fir', 'fit', 'fix', 'fly', 'fog',
  'fox', 'fry', 'fun', 'fur', 'gap', 'gas', 'gel', 'gem', 'get', 'gin', 'got', 'gum', 'gun', 'gut', 'guy',
  'gym', 'ham', 'has', 'hat', 'hay', 'hen', 'her', 'hid', 'him', 'hip', 'his', 'hit', 'hog', 'hop', 'hot',
  'how', 'hub', 'hue', 'hug', 'hut', 'ice', 'icy', 'ill', 'imp', 'ink', 'inn', 'ion', 'its', 'ivy', 'jam',
  'jar', 'jaw', 'jay', 'jet', 'jig', 'job', 'jog', 'joy', 'jug', 'key', 'kid', 'kit', 'lab', 'lap', 'law',
  'lay', 'led', 'leg', 'let', 'lid', 'lip', 'lit', 'log', 'lot', 'low', 'mad', 'man', 'map', 'mat', 'may',
  'men', 'met', 'mid', 'mix', 'mob', 'mom', 'mop', 'mud', 'mug', 'nap', 'net', 'new', 'nil', 'nod', 'nor',
  'not', 'now', 'nut', 'oak', 'oar', 'oat', 'odd', 'off', 'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our',
  'out', 'owe', 'owl', 'own', 'pad', 'pal', 'pan', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'per', 'pet',
  'pie', 'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pro', 'pry', 'pub', 'pun', 'pup', 'put', 'rag',
  'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'ref', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod',
  'rot', 'row', 'rub', 'rug', 'run', 'rut', 'rye', 'sad', 'sap', 'sat', 'saw', 'say', 'sea', 'set', 'sew',
  'she', 'shy', 'sin', 'sip', 'sir', 'sis', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'soy',
  'spa', 'spy', 'sub', 'sum', 'sun', 'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'thy',
  'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tow', 'toy', 'try', 'tub', 'tug', 'two', 'urn', 'use',
  'van', 'vat', 'vet', 'via', 'vie', 'vow', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wet', 'who',
  'why', 'wig', 'win', 'wit', 'wok', 'won', 'woo', 'wow', 'yak', 'yam', 'yap', 'yaw', 'yea', 'yes', 'yet',
  'yew', 'yin', 'you', 'zap', 'zen', 'zip', 'zoo'
];

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=',
  hex: '0123456789abcdef',
  ambiguous: '0O1lI'
};

function secureRandom(max) {
  const bytes = crypto.randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return value % max;
}

function generateFromCharset(charset, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[secureRandom(charset.length)];
  }
  return result;
}

function calculateEntropy(length, charsetSize) {
  return Math.round(length * Math.log2(charsetSize) * 10) / 10;
}

function getStrength(entropy) {
  if (entropy < 40) return 'weak';
  if (entropy < 60) return 'moderate';
  if (entropy < 80) return 'strong';
  return 'very strong';
}

function generatePassword(options = {}) {
  const {
    length = 16,
    type = 'password',
    words = 4,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false
  } = options;

  let password, charsetSize;

  switch (type) {
    case 'pin':
      password = generateFromCharset(CHARSETS.numbers, length);
      charsetSize = 10;
      break;

    case 'hex':
      password = generateFromCharset(CHARSETS.hex, length);
      charsetSize = 16;
      break;

    case 'apikey': {
      // Alphanumeric only, often prefixed
      const apiCharset = CHARSETS.uppercase + CHARSETS.lowercase + CHARSETS.numbers;
      password = generateFromCharset(apiCharset, length);
      charsetSize = 62;
      break;
    }

    case 'passphrase': {
      const selectedWords = [];
      for (let i = 0; i < words; i++) {
        selectedWords.push(WORDS[secureRandom(WORDS.length)]);
      }
      password = selectedWords.join('-');
      // Entropy: log2(wordlist_size^num_words)
      const entropy = Math.round(words * Math.log2(WORDS.length) * 10) / 10;
      return {
        password,
        words,
        type: 'passphrase',
        entropy,
        strength: getStrength(entropy)
      };
    }

    case 'password':
    default: {
      let charset = '';
      if (uppercase) charset += CHARSETS.uppercase;
      if (lowercase) charset += CHARSETS.lowercase;
      if (numbers) charset += CHARSETS.numbers;
      if (symbols) charset += CHARSETS.symbols;

      if (excludeAmbiguous) {
        for (const char of CHARSETS.ambiguous) {
          charset = charset.replace(new RegExp(char, 'g'), '');
        }
      }

      if (charset.length === 0) {
        charset = CHARSETS.lowercase + CHARSETS.numbers;
      }

      password = generateFromCharset(charset, length);
      charsetSize = charset.length;
      break;
    }
  }

  const entropy = calculateEntropy(length, charsetSize);
  return {
    password,
    length,
    type,
    entropy,
    strength: getStrength(entropy)
  };
}

module.exports = async function handler(params = {}) {
  const count = params.count || 1;

  if (count === 1) {
    return generatePassword(params);
  }

  // Generate multiple
  const passwords = [];
  for (let i = 0; i < Math.min(count, 100); i++) {
    const result = generatePassword(params);
    passwords.push(result.password);
  }

  return {
    passwords,
    count: passwords.length,
    type: params.type || 'password'
  };
};
