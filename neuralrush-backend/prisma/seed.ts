import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Achievement Definitions ────────────────────────────────────────

const achievements = [
  { key: 'first_session', title: 'First Steps', description: 'Complete your first training session', rarity: 'COMMON' as const, xpReward: 75, npReward: 25, isHidden: false, iconKey: 'brain' },
  { key: 'sessions_10', title: 'Getting Started', description: 'Complete 10 training sessions', rarity: 'COMMON' as const, xpReward: 150, npReward: 50, isHidden: false, iconKey: 'fire' },
  { key: 'sessions_50', title: 'Dedicated Learner', description: 'Complete 50 training sessions', rarity: 'RARE' as const, xpReward: 500, npReward: 100, isHidden: false, iconKey: 'star' },
  { key: 'sessions_100', title: 'Century Mind', description: 'Complete 100 training sessions', rarity: 'EPIC' as const, xpReward: 1000, npReward: 200, isHidden: false, iconKey: 'trophy' },
  { key: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day training streak', rarity: 'COMMON' as const, xpReward: 200, npReward: 50, isHidden: false, iconKey: 'flame' },
  { key: 'streak_14', title: 'Fortnight Focus', description: 'Maintain a 14-day training streak', rarity: 'RARE' as const, xpReward: 400, npReward: 100, isHidden: false, iconKey: 'flame' },
  { key: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day training streak', rarity: 'EPIC' as const, xpReward: 800, npReward: 200, isHidden: false, iconKey: 'flame' },
  { key: 'streak_100', title: 'Unstoppable Force', description: 'Maintain a 100-day training streak', rarity: 'LEGENDARY' as const, xpReward: 2000, npReward: 500, isHidden: false, iconKey: 'crown' },
  { key: 'level_10', title: 'Cognitive Scout', description: 'Reach level 10', rarity: 'COMMON' as const, xpReward: 300, npReward: 75, isHidden: false, iconKey: 'shield' },
  { key: 'level_25', title: 'Memory Warden', description: 'Reach level 25', rarity: 'RARE' as const, xpReward: 750, npReward: 150, isHidden: false, iconKey: 'shield' },
  { key: 'level_50', title: 'Neural Sovereign', description: 'Reach level 50', rarity: 'LEGENDARY' as const, xpReward: 2000, npReward: 500, isHidden: false, iconKey: 'crown' },
  { key: 'perfect_score', title: 'Perfectionist', description: 'Score 100% on any session', rarity: 'RARE' as const, xpReward: 300, npReward: 75, isHidden: false, iconKey: 'diamond' },
  { key: 'night_owl', title: 'Night Owl', description: 'Complete a session between 2:00 AM and 4:00 AM', rarity: 'RARE' as const, xpReward: 200, npReward: 50, isHidden: true, iconKey: 'moon' },
  { key: 'all_modules', title: 'Renaissance Mind', description: 'Complete at least one session in every cognitive module', rarity: 'EPIC' as const, xpReward: 500, npReward: 150, isHidden: true, iconKey: 'brain' },
  { key: 'new_year', title: 'New Year, New Brain', description: 'Complete a session on January 1st', rarity: 'EPIC' as const, xpReward: 500, npReward: 100, isHidden: true, iconKey: 'sparkle' },
  { key: 'battle_first', title: 'First Blood', description: 'Win your first Brain Battle', rarity: 'COMMON' as const, xpReward: 150, npReward: 50, isHidden: false, iconKey: 'sword' },
  { key: 'battle_10', title: 'Arena Champion', description: 'Win 10 Brain Battles', rarity: 'RARE' as const, xpReward: 500, npReward: 100, isHidden: false, iconKey: 'sword' },
  { key: 'clan_join', title: 'Team Player', description: 'Join a clan', rarity: 'COMMON' as const, xpReward: 100, npReward: 25, isHidden: false, iconKey: 'people' },
  { key: 'daily_7', title: 'Challenge Accepted', description: 'Complete 7 daily challenges', rarity: 'COMMON' as const, xpReward: 200, npReward: 50, isHidden: false, iconKey: 'calendar' },
  { key: 'daily_30', title: 'Daily Devotee', description: 'Complete 30 daily challenges', rarity: 'EPIC' as const, xpReward: 750, npReward: 200, isHidden: false, iconKey: 'calendar' },
];

// ─── Seed Exercises ─────────────────────────────────────────────────

const exercises = [
  // MEMORY exercises (5 exercises, difficulty 1-5)
  { module: 'MEMORY' as const, type: 'MEMORY_MATRIX' as const, difficulty: 1, content: { gridSize: 3, sequence: [0, 1, 3], displayMs: 3000 }, correctAnswer: [0, 1, 3], explanation: 'Remember the highlighted cells in the 3x3 grid.' },
  { module: 'MEMORY' as const, type: 'MEMORY_MATRIX' as const, difficulty: 2, content: { gridSize: 4, sequence: [0, 2, 5, 7], displayMs: 2500 }, correctAnswer: [0, 2, 5, 7], explanation: 'Remember the highlighted cells in the 4x4 grid.' },
  { module: 'MEMORY' as const, type: 'NUMBER_RECALL' as const, difficulty: 3, content: { digits: [7, 3, 9, 1, 5], displayMs: 2000 }, correctAnswer: [7, 3, 9, 1, 5], explanation: 'Recall the 5-digit sequence shown.' },
  { module: 'MEMORY' as const, type: 'WORD_PAIRS' as const, difficulty: 4, content: { pairs: [{ word: 'Sun', partner: 'Moon' }, { word: 'Cat', partner: 'Dog' }, { word: 'Fire', partner: 'Ice' }], displayMs: 5000, testWords: ['Sun', 'Cat', 'Fire'] }, correctAnswer: { Sun: 'Moon', Cat: 'Dog', Fire: 'Ice' }, explanation: 'Match each word with its pair.' },
  { module: 'MEMORY' as const, type: 'NUMBER_RECALL' as const, difficulty: 5, content: { digits: [4, 8, 2, 6, 1, 9, 3], displayMs: 1500 }, correctAnswer: [4, 8, 2, 6, 1, 9, 3], explanation: 'Recall the 7-digit sequence shown briefly.' },

  // FOCUS exercises (5 exercises, difficulty 1-5)
  { module: 'FOCUS' as const, type: 'STROOP' as const, difficulty: 1, content: { items: [{ word: 'RED', inkColor: 'blue' }, { word: 'GREEN', inkColor: 'red' }, { word: 'BLUE', inkColor: 'green' }] }, correctAnswer: ['blue', 'red', 'green'], explanation: 'Name the INK COLOR, not the word.' },
  { module: 'FOCUS' as const, type: 'STROOP' as const, difficulty: 2, content: { items: [{ word: 'YELLOW', inkColor: 'red' }, { word: 'RED', inkColor: 'blue' }, { word: 'GREEN', inkColor: 'yellow' }, { word: 'BLUE', inkColor: 'green' }] }, correctAnswer: ['red', 'blue', 'yellow', 'green'], explanation: 'Identify the ink color for each word.' },
  { module: 'FOCUS' as const, type: 'SPOT_DIFFERENCE' as const, difficulty: 3, content: { gridSize: 4, targetIndex: 7, items: ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'B', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'] }, correctAnswer: 7, explanation: 'Find the item that is different.' },
  { module: 'FOCUS' as const, type: 'DUAL_N_BACK' as const, difficulty: 4, content: { sequence: [1, 3, 5, 1, 3, 5], nBack: 3 }, correctAnswer: [false, false, false, true, true, true], explanation: 'Identify when the current item matches the one shown 3 steps ago.' },
  { module: 'FOCUS' as const, type: 'STROOP' as const, difficulty: 5, content: { items: [{ word: 'PURPLE', inkColor: 'orange' }, { word: 'ORANGE', inkColor: 'purple' }, { word: 'GREEN', inkColor: 'red' }, { word: 'RED', inkColor: 'green' }, { word: 'BLUE', inkColor: 'yellow' }] }, correctAnswer: ['orange', 'purple', 'red', 'green', 'yellow'], explanation: 'Name all 5 ink colors correctly.' },

  // LOGIC exercises (5 exercises, difficulty 1-5)
  { module: 'LOGIC' as const, type: 'PATTERN_COMPLETION' as const, difficulty: 1, content: { sequence: [2, 4, 6, 8], options: [9, 10, 12, 14], question: 'What comes next?' }, correctAnswer: 10, explanation: 'The pattern adds 2 each time.' },
  { module: 'LOGIC' as const, type: 'PATTERN_COMPLETION' as const, difficulty: 2, content: { sequence: [1, 1, 2, 3, 5], options: [6, 7, 8, 9], question: 'What comes next in the Fibonacci sequence?' }, correctAnswer: 8, explanation: 'Each number is the sum of the two before it.' },
  { module: 'LOGIC' as const, type: 'RIDDLE' as const, difficulty: 3, content: { question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', options: ['A globe', 'A map', 'A painting', 'A dream'] }, correctAnswer: 'A map', explanation: 'A map has representations of cities, mountains, and water.' },
  { module: 'LOGIC' as const, type: 'LOGIC_GRID' as const, difficulty: 4, content: { clues: ['Alice is not a doctor.', 'Bob is a teacher.', 'The engineer is not Carol.'], people: ['Alice', 'Bob', 'Carol'], jobs: ['Doctor', 'Teacher', 'Engineer'] }, correctAnswer: { Alice: 'Engineer', Bob: 'Teacher', Carol: 'Doctor' }, explanation: 'Use elimination to match people with jobs.' },
  { module: 'LOGIC' as const, type: 'PATTERN_COMPLETION' as const, difficulty: 5, content: { sequence: [1, 4, 9, 16, 25], options: [30, 36, 49, 64], question: 'What comes next in the sequence of perfect squares?' }, correctAnswer: 36, explanation: '1², 2², 3², 4², 5², 6² = 36' },

  // SPEED exercises (5 exercises, difficulty 1-5)
  { module: 'SPEED' as const, type: 'QUICK_MATH' as const, difficulty: 1, content: { question: '7 + 5 = ?', timeMs: 5000 }, correctAnswer: 12, explanation: 'Simple addition.' },
  { module: 'SPEED' as const, type: 'QUICK_MATH' as const, difficulty: 2, content: { question: '15 × 3 = ?', timeMs: 5000 }, correctAnswer: 45, explanation: 'Multiplication.' },
  { module: 'SPEED' as const, type: 'RAPID_SORT' as const, difficulty: 3, content: { items: [42, 17, 89, 3, 56], sortOrder: 'ascending' }, correctAnswer: [3, 17, 42, 56, 89], explanation: 'Sort the numbers from smallest to largest.' },
  { module: 'SPEED' as const, type: 'QUICK_MATH' as const, difficulty: 4, content: { question: '144 ÷ 12 + 7 × 3 = ?', timeMs: 8000 }, correctAnswer: 33, explanation: '144/12 = 12, 7×3 = 21, 12+21 = 33' },
  { module: 'SPEED' as const, type: 'REACTION_TEST' as const, difficulty: 5, content: { targetDelayMs: 2000, maxResponseMs: 300 }, correctAnswer: null, explanation: 'Click as fast as possible when the target appears.' },

  // CREATIVITY exercises (5 exercises, difficulty 1-5) — AI-graded (correctAnswer = null)
  { module: 'CREATIVITY' as const, type: 'ALTERNATIVE_USES' as const, difficulty: 1, content: { object: 'Paperclip', prompt: 'List as many creative uses for a paperclip as you can think of.', timeMs: 60000 }, correctAnswer: null, explanation: 'Think outside the box for unconventional uses.' },
  { module: 'CREATIVITY' as const, type: 'ALTERNATIVE_USES' as const, difficulty: 2, content: { object: 'Brick', prompt: 'List as many creative uses for a brick as you can think of.', timeMs: 60000 }, correctAnswer: null, explanation: 'Consider both practical and imaginative uses.' },
  { module: 'CREATIVITY' as const, type: 'WORD_CHAIN' as const, difficulty: 3, content: { startWord: 'cold', endWord: 'warm', prompt: 'Create a word chain from COLD to WARM, changing one letter at a time.' }, correctAnswer: null, explanation: 'Each step should change exactly one letter.' },
  { module: 'CREATIVITY' as const, type: 'STORY_SEED' as const, difficulty: 4, content: { words: ['robot', 'garden', 'whisper', 'thunder'], prompt: 'Write a short story using all four words.', timeMs: 120000 }, correctAnswer: null, explanation: 'Incorporate all words naturally into a coherent story.' },
  { module: 'CREATIVITY' as const, type: 'STORY_SEED' as const, difficulty: 5, content: { words: ['crystal', 'betrayal', 'symphony', 'forgotten', 'dawn'], prompt: 'Write a compelling micro-story using all five words.', timeMs: 120000 }, correctAnswer: null, explanation: 'Create an emotionally resonant story incorporating all words.' },

  // LANGUAGE exercises (5 exercises, difficulty 1-5)
  { module: 'LANGUAGE' as const, type: 'VOCABULARY' as const, difficulty: 1, content: { word: 'Benevolent', options: ['Cruel', 'Kind and generous', 'Intelligent', 'Lazy'] }, correctAnswer: 'Kind and generous', explanation: 'Benevolent means well-meaning and kindly.' },
  { module: 'LANGUAGE' as const, type: 'VOCABULARY' as const, difficulty: 2, content: { word: 'Ephemeral', options: ['Lasting forever', 'Short-lived', 'Very large', 'Colorful'] }, correctAnswer: 'Short-lived', explanation: 'Ephemeral means lasting for a very short time.' },
  { module: 'LANGUAGE' as const, type: 'ANALOGIES' as const, difficulty: 3, content: { prompt: 'Book is to Reading as Fork is to ___', options: ['Cooking', 'Eating', 'Kitchen', 'Spoon'] }, correctAnswer: 'Eating', explanation: 'A book is used for reading; a fork is used for eating.' },
  { module: 'LANGUAGE' as const, type: 'SENTENCE_UNSCRAMBLE' as const, difficulty: 4, content: { words: ['the', 'quickly', 'brown', 'fox', 'jumps', 'over', 'lazy', 'the', 'dog'], prompt: 'Unscramble these words into a correct sentence.' }, correctAnswer: 'the quick brown fox jumps over the lazy dog', explanation: 'A classic English pangram.' },
  { module: 'LANGUAGE' as const, type: 'ANALOGIES' as const, difficulty: 5, content: { prompt: 'Physician is to Patient as Lawyer is to ___', options: ['Judge', 'Client', 'Court', 'Law'] }, correctAnswer: 'Client', explanation: 'A physician serves a patient; a lawyer serves a client.' },
];

// ─── Main Seed Function ─────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // Seed achievements (upsert for idempotency)
  console.log('  📌 Seeding achievements...');
  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: { ...ach },
      create: { ...ach },
    });
  }
  console.log(`  ✅ ${achievements.length} achievements seeded`);

  // Seed exercises (use upsert on a compound check)
  console.log('  📌 Seeding exercises...');
  let exerciseCount = 0;
  for (const ex of exercises) {
    // Check if similar exercise exists
    const existing = await prisma.exercise.findFirst({
      where: {
        module: ex.module,
        type: ex.type,
        difficulty: ex.difficulty,
      },
    });

    if (!existing) {
      await prisma.exercise.create({
        data: {
          module: ex.module,
          type: ex.type,
          difficulty: ex.difficulty,
          content: ex.content as object,
          correctAnswer: ex.correctAnswer as object | null,
          explanation: ex.explanation,
          isActive: true,
        },
      });
      exerciseCount++;
    }
  }
  console.log(`  ✅ ${exerciseCount} new exercises seeded (${exercises.length - exerciseCount} already existed)`);

  // Seed test user (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('  📌 Seeding test user...');
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('Test1234!', 12);

    const testUser = await prisma.user.upsert({
      where: { email: 'test@neuralrush.app' },
      update: {},
      create: {
        email: 'test@neuralrush.app',
        username: 'testuser',
        name: 'Test User',
        passwordHash,
        xp: 0,
        level: 1,
        neuralPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        streakShields: 1,
        totalSessions: 0,
        totalXpEarned: 0,
        brainProfile: {
          create: {
            memory: 0,
            focus: 0,
            logic: 0,
            speed: 0,
            creativity: 0,
            language: 0,
            humanScore: 0,
          },
        },
        battleRecord: {
          create: {
            wins: 0,
            losses: 0,
            draws: 0,
            winStreak: 0,
            totalXpWon: 0,
          },
        },
      },
    });
    console.log(`  ✅ Test user seeded: ${testUser.email} / Test1234!`);
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
