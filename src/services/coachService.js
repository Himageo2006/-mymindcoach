import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoachesForLanguage } from '../data/coaches';

const COACH_KEY = 'selected_coach_id';

export async function getSelectedCoach(language = 'en') {
  const savedId = await AsyncStorage.getItem(COACH_KEY);
  const coaches = getCoachesForLanguage(language);
  return coaches.find(c => c.id === savedId) || coaches[0];
}

export async function setSelectedCoach(coach) {
  await AsyncStorage.setItem(COACH_KEY, coach.id);
}
