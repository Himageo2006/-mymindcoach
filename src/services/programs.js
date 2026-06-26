import AsyncStorage from '@react-native-async-storage/async-storage';

// Multi-day guided journeys. Each day opens a focused coaching session.
// Free users get the first `freeDays`; the rest are a Pro upsell.
export const PROGRAMS = [
  {
    id: 'anxiety',
    emoji: '🌊',
    title: '7 Days to Calmer Anxiety',
    subtitle: 'Understand and ease anxious thoughts',
    freeDays: 2,
    days: [
      'understand what triggers my anxiety',
      'learn a grounding technique for anxious moments',
      'challenge an anxious thought that keeps coming back',
      'practice slow breathing to calm my body',
      'reframe a worry I’ve been carrying',
      'build a small daily routine that keeps me calm',
      'reflect on what helped me most this week',
    ],
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'Better Sleep in a Week',
    subtitle: 'Wind down and rest more deeply',
    freeDays: 2,
    days: [
      'figure out what’s keeping me up at night',
      'create a calming wind-down routine',
      'quiet a racing mind before bed',
      'let go of today’s stress before sleep',
      'set up my space for better rest',
      'handle waking up in the middle of the night',
      'reflect on how my sleep changed this week',
    ],
  },
  {
    id: 'confidence',
    emoji: '💪',
    title: 'Build Your Confidence',
    subtitle: 'Grow self-belief, one day at a time',
    freeDays: 2,
    days: [
      'notice the way I talk to myself',
      'recognize a strength I overlook',
      'reframe a recent moment of self-doubt',
      'set one small goal I can win today',
      'handle the fear of what others think',
      'celebrate a win I usually dismiss',
      'reflect on how my confidence grew this week',
    ],
  },
  {
    id: 'stress',
    emoji: '🧘',
    title: 'Manage Daily Stress',
    subtitle: 'Find calm in a busy week',
    freeDays: 2,
    days: [
      'name what’s stressing me most right now',
      'learn a quick reset for stressful moments',
      'set a boundary that protects my energy',
      'break an overwhelming task into small steps',
      'make time for one thing that recharges me',
      'respond instead of react under pressure',
      'reflect on what eased my stress this week',
    ],
  },
];

export function getProgram(id) {
  return PROGRAMS.find((p) => p.id === id) || null;
}

// Number of completed days for a program (0..days.length).
export async function getProgramProgress(id) {
  return parseInt((await AsyncStorage.getItem(`program_${id}_done`)) || '0', 10) || 0;
}

// Mark up to (and including) dayIndex complete. Never goes backwards.
export async function completeProgramDay(id, dayIndex) {
  const current = await getProgramProgress(id);
  const next = Math.max(current, dayIndex + 1);
  await AsyncStorage.setItem(`program_${id}_done`, String(next));
  return next;
}

// The message that seeds a day's coaching session.
export function daySeed(program, dayIndex) {
  const theme = program.days[dayIndex];
  return `Let's start day ${dayIndex + 1} of "${program.title}". Today I'd like to ${theme}.`;
}
