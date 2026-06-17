/**
 * Exercise Generator Engine
 * Generates fresh, unique exercises algorithmically per module.
 * No DB needed — exercises are ephemeral, identified by a signed ID.
 */

import crypto from 'crypto';
import { env } from '../config/env.js';

export type ModuleType = 'MEMORY' | 'FOCUS' | 'LOGIC' | 'SPEED' | 'CREATIVITY' | 'LANGUAGE';

export interface GeneratedExercise {
  id: string; // HMAC-signed id encoding the answer for server-side verification
  module: ModuleType;
  type: string;
  difficulty: number;
  content: {
    question: string;
    options?: string[];
    hint?: string;
  };
  // Note: correctAnswer is NOT returned to the client
}

interface ExerciseWithAnswer extends GeneratedExercise {
  _answer: string;
}

// ─── Utility ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sign an exercise ID so we can verify the answer server-side without DB.
 * Format: base64(json({ answer, type })) + "." + hmac
 */
function signExercise(answer: string, type: string): string {
  const payload = Buffer.from(JSON.stringify({ answer, type })).toString('base64url');
  const sig = crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyExerciseId(id: string): { answer: string; type: string } | null {
  try {
    const [payload, sig] = id.split('.');
    const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url');
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

// ─── Generators ───────────────────────────────────────────────────────

function generateSpeed(difficulty: number): ExerciseWithAnswer {
  const ops = difficulty <= 3 ? ['+', '-'] : difficulty <= 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = pick(ops);
  let a: number, b: number, ans: number;

  const scale = Math.min(difficulty * 8, 80);

  if (op === '+') {
    a = rand(10, scale); b = rand(10, scale); ans = a + b;
  } else if (op === '-') {
    a = rand(20, scale + 20); b = rand(5, a - 5 || 5); ans = a - b;
  } else if (op === '×') {
    a = rand(2, difficulty + 4); b = rand(2, difficulty + 4); ans = a * b;
  } else {
    b = rand(2, difficulty + 2);
    ans = rand(2, difficulty + 6);
    a = ans * b;
  }

  const wrong = (offset: number) => ans + (Math.random() > 0.5 ? offset : -offset);
  const options = shuffle([String(ans), String(wrong(rand(1, 5))), String(wrong(rand(6, 12))), String(wrong(rand(13, 20)))]);

  return {
    id: '',
    module: 'SPEED',
    type: 'QUICK_MATH',
    difficulty,
    content: { question: `${a} ${op} ${b} = ?`, options },
    _answer: String(ans),
  };
}

function generateMemory(difficulty: number): ExerciseWithAnswer {
  const len = Math.min(3 + difficulty, 10);
  if (difficulty <= 4) {
    // Number sequence recall
    const digits = Array.from({ length: len }, () => rand(0, 9)).join(' ');
    const parts = digits.split(' ');
    const wrong = (offset: number) => {
      const idx = rand(0, parts.length - 1);
      const copy = [...parts];
      copy[idx] = String((parseInt(copy[idx]) + offset + 10) % 10);
      return copy.join(' ');
    };
    const options = shuffle([digits, wrong(1), wrong(2), wrong(3)]);
    return {
      id: '', module: 'MEMORY', type: 'NUMBER_RECALL', difficulty,
      content: { question: `🧠 Memorize this sequence:\n\n${digits}\n\nWhat was the sequence?`, options },
      _answer: digits,
    };
  } else {
    // Word pairs recall
    const wordBank = ['star', 'moon', 'fire', 'tree', 'book', 'road', 'bird', 'lake', 'wind', 'gold', 'rain', 'city', 'fish', 'sand', 'bell'];
    const words = shuffle(wordBank).slice(0, Math.min(len, 5));
    const answer = words.join(', ');
    const wrong1 = shuffle(words).join(', ');
    const wrong2 = [...words.slice(1), pick(wordBank.filter(w => !words.includes(w)))].join(', ');
    const wrong3 = [pick(wordBank.filter(w => !words.includes(w))), ...words.slice(0, -1)].join(', ');
    const options = shuffle([answer, wrong1, wrong2, wrong3]);
    return {
      id: '', module: 'MEMORY', type: 'WORD_PAIRS', difficulty,
      content: { question: `📝 Remember these words:\n\n${answer}\n\nWhich list is correct?`, options },
      _answer: answer,
    };
  }
}

function generateLogic(difficulty: number): ExerciseWithAnswer {
  if (difficulty <= 3) {
    // Simple arithmetic sequence
    const start = rand(1, 10);
    const step = rand(2, 5);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const ans = start + step * 4;
    const options = shuffle([String(ans), String(ans + 1), String(ans + step + 1), String(ans - step)]);
    return {
      id: '', module: 'LOGIC', type: 'PATTERN_COMPLETION', difficulty,
      content: { question: `What comes next?\n\n${seq.join(' → ')} → ?`, options },
      _answer: String(ans),
    };
  } else if (difficulty <= 6) {
    // Fibonacci-style
    const a = rand(1, 5), b = rand(a + 1, a + 6);
    const seq = [a, b, a + b, a + b + b, a + b + (a + b + b)];
    const ans = b + (a + b) + (a + b + b);
    const options = shuffle([String(ans), String(ans + 1), String(ans - 2), String(ans + seq[1])]);
    return {
      id: '', module: 'LOGIC', type: 'PATTERN_COMPLETION', difficulty,
      content: { question: `Find the pattern and complete:\n\n${seq.join(', ')}, ?`, options, hint: 'Each term = sum of the two before it' },
      _answer: String(ans),
    };
  } else {
    // Logic grid
    const names = shuffle(['Alice', 'Bob', 'Carlos', 'Diana']);
    const items = shuffle(['red', 'blue', 'green', 'yellow']);
    const ans = names[0];
    return {
      id: '', module: 'LOGIC', type: 'LOGIC_GRID', difficulty,
      content: {
        question: `${names[0]} does not have ${items[1]}.\n${names[1]} has ${items[0]}.\n${names[2]} does not have ${items[0]} or ${items[2]}.\n\nWho could have ${items[3]}?`,
        options: shuffle([names[0], names[2], names[3], 'None of them']),
      },
      _answer: names[0],
    };
  }
}

function generateFocus(difficulty: number): ExerciseWithAnswer {
  const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
  const displayWord = pick(colors);
  const inkColor = pick(colors.filter(c => c !== displayWord));

  if (difficulty <= 3) {
    // Simple Stroop
    return {
      id: '', module: 'FOCUS', type: 'STROOP', difficulty,
      content: {
        question: `The word below is printed in ${inkColor} ink:\n\n"${displayWord}"\n\nWhat COLOR is the ink?`,
        options: shuffle(colors.slice(0, 4)),
      },
      _answer: inkColor,
    };
  } else {
    // Count Fs (attention exercise)
    const sentences = [
      { s: 'FINISHED FILES ARE THE RESULT OF YEARS OF SCIENTIFIC STUDY', n: 6 },
      { s: 'FOUR OF FIVE FOOTBALL FANS FEEL FANTASTIC', n: 6 },
      { s: 'FAR FROM FAMILIAR FACES, FREEDOM FEELS FRESH', n: 6 },
      { s: 'FIFTY FINE FLOWERS FELL FROM THE FIELD', n: 5 },
    ];
    const { s, n } = pick(sentences);
    const opts = shuffle([String(n), String(n - 1), String(n - 2), String(n + 1)]);
    return {
      id: '', module: 'FOCUS', type: 'SPOT_DIFFERENCE', difficulty,
      content: { question: `How many letter Fs are in:\n\n"${s}"`, options: opts },
      _answer: String(n),
    };
  }
}

const CREATIVITY_POOL: Array<{ question: string; options: string[]; answer: string }> = [
  { question: 'Alternative uses for a brick (pick the most creative):', options: ['Build a wall', 'Paperweight for massive books', 'Paving a garden', 'Corner of a house'], answer: 'Paperweight for massive books' },
  { question: 'I speak without a mouth and hear without ears. What am I?', options: ['Wind', 'Echo', 'Shadow', 'Ghost'], answer: 'Echo' },
  { question: 'What has keys but can\'t open locks?', options: ['A map', 'A piano', 'A computer keyboard', 'A safe'], answer: 'A piano' },
  { question: 'A man is 20 years old but has had only 5 birthdays. How?', options: ['He\'s a robot', 'He was born on February 29', 'He skipped birthdays', 'He lied about his age'], answer: 'He was born on February 29' },
  { question: 'Complete the story: The door creaked open, revealing...', options: ['An empty room', 'A glowing vortex leading to another dimension', 'A cat', 'A light switch'], answer: 'A glowing vortex leading to another dimension' },
  { question: 'If you were invisible for a day, what would be most useful?', options: ['Sleeping in', 'Listening to conversations in important meetings', 'Eating free food', 'Watching movies'], answer: 'Listening to conversations in important meetings' },
  { question: 'What invention lets you see through walls?', options: ['A telescope', 'A camera', 'A window', 'X-ray machine'], answer: 'A window' },
];

function generateCreativity(_difficulty: number): ExerciseWithAnswer {
  const prompt = pick(CREATIVITY_POOL);
  return {
    id: '', module: 'CREATIVITY', type: 'ALTERNATIVE_USES', difficulty: _difficulty,
    content: { question: `💡 ${prompt.question}`, options: shuffle(prompt.options) },
    _answer: prompt.answer,
  };
}

const LANGUAGE_POOL: Array<{ question: string; options: string[]; answer: string }> = [
  { question: 'Synonym for "Ephemeral":', options: ['Eternal', 'Fleeting', 'Solid', 'Loud'], answer: 'Fleeting' },
  { question: 'Antonym for "Obscure":', options: ['Hidden', 'Dark', 'Clear', 'Tiny'], answer: 'Clear' },
  { question: 'Apple is to Fruit as Carrot is to...?', options: ['Root', 'Vegetable', 'Orange', 'Rabbit'], answer: 'Vegetable' },
  { question: 'Unscramble: N R A B I', options: ['BRAN', 'RAIN', 'BRAIN', 'BARN'], answer: 'BRAIN' },
  { question: 'Which word does NOT belong: Dog, Cat, Eagle, Fish, Parrot?', options: ['Dog', 'Eagle', 'Fish', 'Parrot'], answer: 'Fish' },
  { question: 'Synonym for "Gregarious":', options: ['Lonely', 'Sociable', 'Serious', 'Silent'], answer: 'Sociable' },
  { question: 'Complete: "To be or not to ___"', options: ['be', 'do', 'see', 'go'], answer: 'be' },
  { question: 'Antonym for "Benevolent":', options: ['Kind', 'Malevolent', 'Generous', 'Gentle'], answer: 'Malevolent' },
];

function generateLanguage(_difficulty: number): ExerciseWithAnswer {
  const prompt = pick(LANGUAGE_POOL);
  return {
    id: '', module: 'LANGUAGE', type: 'VOCABULARY', difficulty: _difficulty,
    content: { question: `📖 ${prompt.question}`, options: shuffle(prompt.options) },
    _answer: prompt.answer,
  };
}

// ─── Public API ────────────────────────────────────────────────────────

const GENERATORS: Record<ModuleType, (d: number) => ExerciseWithAnswer> = {
  SPEED: generateSpeed,
  MEMORY: generateMemory,
  LOGIC: generateLogic,
  FOCUS: generateFocus,
  CREATIVITY: generateCreativity,
  LANGUAGE: generateLanguage,
};

export function generateExercises(module: ModuleType, difficulty: number, count: number): GeneratedExercise[] {
  const gen = GENERATORS[module];
  return Array.from({ length: count }, () => {
    const ex = gen(difficulty);
    ex.id = signExercise(ex._answer, ex.type);
    const { _answer, ...safe } = ex;
    return safe;
  });
}

export function scoreExercise(exerciseId: string, userAnswer: string): boolean {
  const verified = verifyExerciseId(exerciseId);
  if (!verified) return false;
  return String(verified.answer).toLowerCase().trim() === String(userAnswer).toLowerCase().trim();
}
