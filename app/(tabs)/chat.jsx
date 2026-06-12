import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/context/ThemeContext';
import { sendMessage } from '../../src/services/claude';
import { getUserProfile } from '../../src/services/storage';
import { canSendMessage, incrementMessageCount, FREE_LIMITS, getPlanConfig } from '../../src/services/subscription';
import { getChatLanguage, getAppLanguage } from '../../src/services/language';
import { extractAndSaveMemory } from '../../src/services/memory';
import { tapLight, tapMedium, success, error as hapticError } from '../../src/services/haptics';
import { getSelectedCoach } from '../../src/services/coachService';
import { needsCheckup, getLastCheckupResult } from '../../src/services/checkup';
import MentalCheckup from '../mental-checkup';

const SERVER_URL = 'https://mindtalk-server-production.up.railway.app';
const APP_KEY = 'mk-app-2024-xK9pL3mNqR7vW2jT';

const SUGGESTIONS_EN = [
  "I've been feeling really stressed lately",
  "I can't stop overthinking everything",
  "I need help calming my anxiety",
  "I just need someone to talk to",
];
const SUGGESTIONS_BY_LANG = {
  ar: {
    female:  ['أنا حاسسة بضغط نفسي كتير', 'مش قادرة أوقف التفكير', 'محتاجة حد أتكلم معه', 'قلقانة ومش عارفة ليه'],
    male:    ['أنا حاسس بضغط نفسي كتير',  'مش قادر أوقف التفكير',  'محتاج حد أتكلم معه',  'قلقان ومش عارف ليه'],
    default: ['بحس بضغط نفسي كتير',        'مش قادر/ة أوقف التفكير', 'محتاج/ة حد أتكلم معه', 'قلقان/ة ومش عارف ليه'],
  },
  es: ['Me he sentido muy estresado/a', 'No puedo dejar de preocuparme', 'Necesito hablar con alguien', 'Siento mucha ansiedad'],
  fr: ['Je me sens très stressé(e)', 'Je n\'arrête pas de ruminer', 'J\'ai besoin de parler à quelqu\'un', 'Mon anxiété est difficile à gérer'],
  de: ['Ich fühle mich sehr gestresst', 'Ich kann nicht aufhören nachzudenken', 'Ich brauche jemanden zum Reden', 'Meine Angst überwältigt mich'],
  tr: ['Son zamanlarda çok stresli hissediyorum', 'Her şeyi aşırı düşünüyorum', 'Biriyle konuşmam gerekiyor', 'Kaygımı yönetmekte zorlanıyorum'],
  pt: ['Tenho me sentido muito estressado/a', 'Não consigo parar de pensar demais', 'Preciso conversar com alguém', 'Minha ansiedade está difícil'],
  ru: ['Я чувствую сильный стресс', 'Я не могу перестать думать об этом', 'Мне нужно поговорить с кем-то', 'Моя тревога трудно переносится'],
  it: ['Mi sento molto stressato/a', 'Non riesco a smettere di rimuginare', 'Ho bisogno di parlare con qualcuno', 'La mia ansia mi sopraffà'],
  fa: ['خیلی تحت فشار هستم', 'نمی‌تونم فکر کردن رو متوقف کنم', 'باید با کسی صحبت کنم', 'اضطرابم سنگینه'],
};
function getSuggestions(lang, userGender) {
  const s = SUGGESTIONS_BY_LANG[lang];
  if (!s) return SUGGESTIONS_EN;
  if (Array.isArray(s)) return s;
  // Arabic — gender-aware
  if (userGender === 'female') return s.female;
  if (userGender === 'male')   return s.male;
  return s.default;
}

// ─── Canned instant replies for Arabic suggestion chips ──────────────────────
// Keyed by exact suggestion text. Returns reply based on userGender + dialect.
// Bypasses API call entirely — instant, zero cost, guaranteed quality.
const CANNED_REPLIES_AR = {
  // ── "أنا حاسس/ة بضغط نفسي كتير" ────────────────────────────────────────
  'أنا حاسسة بضغط نفسي كتير': (dialect) => dialect === 'syrian'
    ? 'والله هيدا ثقيل. شو اللي عم يضغط عليكِ أكتر هلق؟'
    : 'والله ده تقيل. بيجيلِك الضغط ده من إيه؟',
  'أنا حاسس بضغط نفسي كتير': (dialect) => dialect === 'syrian'
    ? 'والله هيدا ثقيل. شو اللي عم يضغط عليك أكتر هلق؟'
    : 'والله ده تقيل. بيجيلك الضغط ده من إيه؟',
  'بحس بضغط نفسي كتير': (dialect) => dialect === 'syrian'
    ? 'والله هيدا ثقيل. شو اللي عم يضغط عليك؟'
    : 'والله ده تقيل. بيجيلك الضغط ده من إيه؟',

  // ── "مش قادر/ة أوقف التفكير" ────────────────────────────────────────────
  'مش قادرة أوقف التفكير': (dialect) => dialect === 'syrian'
    ? 'التفكير الزيادة مرهق كتير. شو اللي عم يدور في بالِك أكتر شي؟'
    : 'التفكير الزيادة ده مرهق جداً. في إيه بالظبط اللي بيدور في دماغِك؟',
  'مش قادر أوقف التفكير': (dialect) => dialect === 'syrian'
    ? 'التفكير الزيادة مرهق كتير. شو اللي عم يدور في بالك أكتر شي؟'
    : 'التفكير الزيادة ده مرهق جداً. في إيه بالظبط اللي بيدور في دماغك؟',
  'مش قادر/ة أوقف التفكير': (dialect) => dialect === 'syrian'
    ? 'التفكير الزيادة مرهق كتير. شو اللي عم يدور في بالك؟'
    : 'التفكير الزيادة ده مرهق جداً. في إيه اللي بيدور في دماغك؟',

  // ── "محتاج/ة حد أتكلم معه" ──────────────────────────────────────────────
  'محتاجة حد أتكلم معه': (dialect) => dialect === 'syrian'
    ? 'أنا هون معِك. قوليلي شو اللي على بالِك هلق؟'
    : 'أنا هنا معاكِ. قوليلي إيه اللي على بالِك دلوقتي؟',
  'محتاج حد أتكلم معه': (dialect) => dialect === 'syrian'
    ? 'أنا هون معك. قوللي شو اللي على بالك هلق؟'
    : 'أنا هنا معاك. قوللي إيه اللي على بالك دلوقتي؟',
  'محتاج/ة حد أتكلم معه': (dialect) => dialect === 'syrian'
    ? 'أنا هون معك. شو اللي على بالك؟'
    : 'أنا هنا معاك. قوللي إيه اللي على بالك دلوقتي؟',

  // ── "قلقان/ة ومش عارف/ة ليه" ────────────────────────────────────────────
  'قلقانة ومش عارفة ليه': (dialect) => dialect === 'syrian'
    ? 'هيدا إحساس صعب لما ما بتعرفي سببه. من إيمتى عم تحسي بهيك قلق؟'
    : 'ده إحساس صعب لما مش قادرة تفسريه. من إمتى بيجيلِك القلق ده؟',
  'قلقان ومش عارف ليه': (dialect) => dialect === 'syrian'
    ? 'هيدا إحساس صعب لما ما بتعرف سببه. من إيمتى عم تحس بهيك قلق؟'
    : 'ده إحساس صعب لما مش قادر تفسره. من إمتى بيجيلك القلق ده؟',
  'قلقان/ة ومش عارف ليه': (dialect) => dialect === 'syrian'
    ? 'هيدا إحساس صعب. من إيمتى عم تحس بهيك قلق؟'
    : 'ده إحساس صعب لما مش قادر تفسره. من إمتى بيجيلك القلق ده؟',
};

function getCannedReply(text, coachDialect) {
  const fn = CANNED_REPLIES_AR[text];
  if (!fn) return null;
  return fn(coachDialect || 'egyptian');
}

const WELCOME_STRINGS = {
  ar: {
    noCheckup: (n, cn, cg, ug) => {
      const fc = cg === 'female';
      const fu = ug === 'female';
      return `أهلاً ${n}! 😊 أنا ${cn}، ${fc ? 'مدربتك الشخصية' : 'مدربك الشخصي'}. أنا هنا عشان أسمع${fu ? 'ِك' : 'ك'} وأكون معا${fu ? 'كِ' : 'ك'} في أي حاجة بتمر${fu ? 'ي' : ''} بيها. من غير أي حكم. إيه اللي على بال${fu ? 'ِك' : 'ك'} النهارده؟`;
    },
    withCheckup: (n, cn, mood, topic, cg, ug) => {
      const fc = cg === 'female';
      const fu = ug === 'female';
      return `أهلاً ${n}! 😊 أنا ${cn}. ${fc ? 'مبسوطة' : 'مبسوط'} إن${fu ? 'كِ' : 'ك'} هنا. إيه اللي على بال${fu ? 'ِك' : 'ك'} النهارده؟`;
    },
  },
  es: {
    noCheckup: (n, cn) => `¡Hola ${n}! 😊 Soy ${cn}, tu coach personal. Estoy aquí para escucharte y acompañarte — sin juicios, solo cuidado genuino. ¿Cómo estás hoy?`,
    withCheckup: (n, cn, mood, topic) => `¡Hola ${n}! 😊 Soy ${cn}.${mood ? ` Veo que hoy te sientes ${mood} —` : ''} He revisado tu check-in y estoy aquí contigo. Parece que ${topic} te está pesando — trabajemos juntos en eso. ¿Por dónde quieres empezar?`,
  },
  fr: {
    noCheckup: (n, cn) => `Bonjour ${n} ! 😊 Je suis ${cn}, ton coach personnel. Je suis là pour t'écouter, sans jugement. Comment vas-tu aujourd'hui ?`,
    withCheckup: (n, cn, mood, topic) => `Bonjour ${n} ! 😊 Je suis ${cn}.${mood ? ` Je vois que tu te sens ${mood} aujourd'hui —` : ''} J'ai regardé ton bilan et je suis là pour toi. Il semble que ${topic} te pèse — travaillons là-dessus ensemble. Par où veux-tu commencer ?`,
  },
  de: {
    noCheckup: (n, cn) => `Hallo ${n}! 😊 Ich bin ${cn}, dein persönlicher Coach. Ich bin hier, um dir zuzuhören — ohne Urteile. Wie geht es dir heute?`,
    withCheckup: (n, cn, mood, topic) => `Hallo ${n}! 😊 Ich bin ${cn}.${mood ? ` Ich sehe, dass du dich heute ${mood} fühlst —` : ''} Ich habe dein Check-in gelesen und bin ganz für dich da. Es scheint, dass ${topic} dich belastet — lass uns das gemeinsam angehen. Wo möchtest du anfangen?`,
  },
  tr: {
    noCheckup: (n, cn) => `Merhaba ${n}! 😊 Ben ${cn}, kişisel koçun. Seni dinlemek ve desteklemek için buradayım — yargısız, gerçek bir ilgiyle. Bugün nasılsın?`,
    withCheckup: (n, cn, mood, topic) => `Merhaba ${n}! 😊 Ben ${cn}.${mood ? ` Bugün ${mood} hissettiğini görüyorum —` : ''} Check-in'ini inceledim ve seninle birlikteyim. ${topic} seni zorluyor gibi görünüyor — birlikte üzerinde çalışalım. Nereden başlamak istersin?`,
  },
  pt: {
    noCheckup: (n, cn) => `Olá ${n}! 😊 Sou ${cn}, seu coach pessoal. Estou aqui para ouvir e apoiar você — sem julgamentos. Como você está hoje?`,
    withCheckup: (n, cn, mood, topic) => `Olá ${n}! 😊 Sou ${cn}.${mood ? ` Vejo que você está se sentindo ${mood} hoje —` : ''} Li seu check-in e estou aqui com você. Parece que ${topic} está te pesando — vamos trabalhar nisso juntos. Por onde quer começar?`,
  },
  ru: {
    noCheckup: (n, cn) => `Привет ${n}! 😊 Я ${cn}, твой личный коуч. Я здесь, чтобы слушать тебя — без осуждения. Как ты сегодня?`,
    withCheckup: (n, cn, mood, topic) => `Привет ${n}! 😊 Я ${cn}.${mood ? ` Я вижу, что сегодня ты чувствуешь ${mood} —` : ''} Я посмотрел твой чек-ин и полностью сосредоточен на тебе. Похоже, ${topic} давит на тебя — давай разберёмся вместе. С чего хочешь начать?`,
  },
  it: {
    noCheckup: (n, cn) => `Ciao ${n}! 😊 Sono ${cn}, il tuo coach personale. Sono qui per ascoltarti — senza giudizi. Come stai oggi?`,
    withCheckup: (n, cn, mood, topic) => `Ciao ${n}! 😊 Sono ${cn}.${mood ? ` Vedo che oggi ti senti ${mood} —` : ''} Ho letto il tuo check-in e sono qui con te. Sembra che ${topic} ti stia pesando — lavoriamoci insieme. Da dove vuoi iniziare?`,
  },
  fa: {
    noCheckup: (n, cn) => `سلام ${n}! 😊 من ${cn}، کوچ شخصی شما هستم. اینجام تا گوش بدم — بدون قضاوت. امروز چطوری؟`,
    withCheckup: (n, cn, mood, topic) => `سلام ${n}! 😊 من ${cn}.${mood ? ` می‌بینم امروز احساس ${mood} داری —` : ''} چک-این‌ات رو خوندم و اینجام. به نظر میاد ${topic} داره اذیتت می‌کنه — بیا با هم روش کار کنیم. از کجا شروع کنیم؟`,
  },
};

function buildWelcome(coach, userName, checkup, userGender) {
  const lang = coach.language || 'en';
  const strings = WELCOME_STRINGS[lang];

  if (!checkup) {
    if (strings) return strings.noCheckup(userName, coach.name, coach.gender, userGender);
    return `Hi ${userName}! 😊 I'm ${coach.name}, your personal wellness coach. I'm here to listen and support you — no judgment, just genuine care. How are you doing today?`;
  }

  const { answers } = checkup;
  const topic = answers?.topic?.label || "what's on your mind";
  const mood  = answers?.mood?.label  || '';

  if (strings) return strings.withCheckup(userName, coach.name, mood.toLowerCase(), topic.toLowerCase(), coach.gender, userGender);

  const moodLine = mood ? ` I saw you're feeling ${mood.toLowerCase()} today —` : '';
  return `Hi ${userName}! 😊 I'm ${coach.name}.${moodLine} I've looked over your check-in and I'm here, fully focused on you. It sounds like ${topic.toLowerCase()} has been weighing on you — let's work through that together. Where would you like to start?`;
}

function TypingIndicator({ Colors, coachAvatar }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 }}>
      <View style={[styles_static.avatarCircle, { backgroundColor: Colors.primaryLight }]}>
        <Text style={{ fontSize: 20 }}>{coachAvatar || '🧘‍♀️'}</Text>
      </View>
      <View style={[styles_static.bubble, { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 }]}>
        <View style={{ flexDirection: 'row', gap: 4, padding: 4 }}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: Colors.textMuted,
              opacity: dot,
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }]
            }} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function Chat() {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'fa'].includes(i18n.language);
  const styles = createStyles(Colors, isRTL);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Friend');
  const [userGender, setUserGender] = useState(null);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(FREE_LIMITS.messagesPerDay);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isRecording = audioRecorder.isRecording;
  const [transcribing, setTranscribing] = useState(false);
  const [isOnline] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [coach, setCoach] = useState({ name: 'Sarah', avatar: '🧘‍♀️', gender: 'female', specialty: 'Certified Wellness Coach' });
  const [initializing, setInitializing] = useState(true);
  const [showCheckup, setShowCheckup] = useState(false);
  const listRef = useRef(null);
  const isMounted = useRef(true);

  // Reload coach whenever the screen comes into focus (e.g. after coach-select)
  useFocusEffect(useCallback(() => {
    getSelectedCoach().then(c => { if (isMounted.current) setCoach(c); }).catch(() => {});
  }, []));

  useEffect(() => {
    isMounted.current = true;

    async function init() {
      if (await needsCheckup()) {
        if (isMounted.current) { setShowCheckup(true); setInitializing(false); }
        return;
      }
      await loadChat();
    }
    init();

    return () => {
      isMounted.current = false;
      setMessages(prev => {
        if (prev.length > 3) extractAndSaveMemory(prev);
        return prev;
      });
    };
  }, []);

  async function loadChat() {
    try {
      const lang = await getAppLanguage();
      const plan = await getPlanConfig();
      setVoiceEnabled(plan.voiceMessages);
      const selectedCoach = await getSelectedCoach(lang);
      const { name, gender: userGenderVal } = await getUserProfile();
      setUserGender(userGenderVal);
      const checkup = await getLastCheckupResult();
      const { remaining: rem } = await canSendMessage();

      if (!isMounted.current) return;
      setCoach(selectedCoach);
      setUserName(name);
      setRemaining(rem);
      setMessages([{
        id: '0',
        role: 'assistant',
        content: buildWelcome(selectedCoach, name, checkup, userGenderVal),
        time: new Date(),
      }]);
    } catch (e) {
      console.error('loadChat error:', e);
    } finally {
      if (isMounted.current) setInitializing(false);
    }
  }

  async function handleCheckupComplete() {
    setShowCheckup(false);
    setInitializing(true);
    await loadChat();
  }

  async function handleSend(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const { allowed } = await canSendMessage();
    if (!allowed) {
      router.push('/paywall');
      return;
    }

    tapMedium();
    setInput('');
    setError('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: userText, time: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // ── Canned reply for Arabic suggestion chips — instant, no API call ──────
    const canned = (coach.language || i18n.language) === 'ar'
      ? getCannedReply(userText, coach.dialect)
      : null;

    if (canned) {
      // Small natural delay so it doesn't feel robotic
      await new Promise(r => setTimeout(r, 900));
      await incrementMessageCount();
      const { remaining: newRem } = await canSendMessage();
      setRemaining(newRem);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: canned, time: new Date() }]);
      success();
      setLoading(false);
      return;
    }

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const checkup = await getLastCheckupResult();
      const reply = await sendMessage(apiMessages, userName, coach.name, coach.gender, checkup, coach.language, coach.id, userGender);
      await incrementMessageCount();
      const { remaining: newRem } = await canSendMessage();
      setRemaining(newRem);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply, time: new Date() }]);
      success();
    } catch (err) {
      hapticError();
      const isAr = (coach.language || i18n.language) === 'ar';
      setError(isAr ? 'في حاجة غلط. حاولي/حاول تاني.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setError('Microphone permission is required for voice messages.');
        return;
      }
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.record();
      tapMedium();
    } catch (err) {
      setError('Could not start recording. Please try again.');
    }
  }

  async function stopRecording() {
    if (!audioRecorder.isRecording) return;
    setTranscribing(true);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const chatLanguage = await getChatLanguage();
      const formData = new FormData();
      formData.append('audio', { uri, type: 'audio/m4a', name: 'voice.m4a' });
      formData.append('language', chatLanguage);
      const response = await fetch(`${SERVER_URL}/api/transcribe`, { method: 'POST', headers: { 'x-app-key': APP_KEY }, body: formData });
      const data = await response.json();
      if (data.text) setInput(data.text);
      else setError('Could not transcribe audio. Please try again.');
    } catch (err) {
      setError('Transcription failed. Please try again.');
    } finally {
      setTranscribing(false);
    }
  }

  function formatTime(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Detect if message content is Arabic/Farsi (RTL text)
  function isMsgRTL(content) {
    return /[؀-ۿݐ-ݿ]/.test(content);
  }

  function renderMessage({ item }) {
    const isUser = item.role === 'user';
    const msgIsRTL = isMsgRTL(item.content);
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{coach.avatar}</Text>
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
            <Text style={[
              styles.bubbleText,
              isUser && styles.bubbleTextUser,
              msgIsRTL && { textAlign: 'right', writingDirection: 'rtl' }
            ]}>{item.content}</Text>
          </View>
          <View style={[styles.timeRow, isUser && styles.timeRowUser]}>
            <Text style={styles.timeText}>{formatTime(item.time)}</Text>
            {isUser && <Text style={styles.readTick}>✓✓</Text>}
          </View>
        </View>
        {isUser && <View style={styles.userAvatarPlaceholder} />}
      </View>
    );
  }

  if (showCheckup) {
    return <MentalCheckup onComplete={handleCheckupComplete} />;
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={{ fontSize: 24 }}>{coach.avatar}</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{coach.name}</Text>
          <Text style={styles.headerTitle}>{isOnline ? t('availableNow') : coach.specialty}</Text>
        </View>
        <TouchableOpacity style={styles.crisisBtn} onPress={() => router.push('/crisis')}>
          <Text style={styles.crisisBtnText}>🆘</Text>
        </TouchableOpacity>
      </View>

      {/* Medical Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ⚕️ Not medical advice. For emergencies contact a licensed professional or call emergency services.
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>{t('privateSession')}</Text>
            </View>
          }
          ListFooterComponent={loading ? <TypingIndicator Colors={Colors} coachAvatar={coach.avatar} /> : null}
        />

        {messages.length === 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>{t('startConversation')}</Text>
            <View style={styles.suggestionsRow}>
              {getSuggestions(coach.language || i18n.language, userGender).map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => { tapLight(); handleSend(s); }}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {remaining <= 3 && remaining !== Infinity && (
          <TouchableOpacity style={styles.limitBanner} onPress={() => router.push('/paywall')}>
            <Text style={styles.limitText}>
              {remaining === 0
                ? '🔒 Session limit reached — Upgrade for unlimited sessions'
                : `⚡ ${remaining} free session${remaining === 1 ? '' : 's'} left today`}
            </Text>
          </TouchableOpacity>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {transcribing && (
          <View style={styles.transcribingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.transcribingText}>
              {(coach.language || i18n.language) === 'ar' ? 'بيتحول الصوت لنص...' : 'Converting voice to text...'}
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive, !voiceEnabled && styles.micBtnLocked]}
            onPress={voiceEnabled
              ? (isRecording ? stopRecording : startRecording)
              : () => router.push('/paywall')}
            disabled={transcribing}
          >
            <Text style={styles.micIcon}>{!voiceEnabled ? '🔒' : isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={isRecording
              ? ((coach.language || i18n.language) === 'ar' ? 'جاري التسجيل...' : 'Recording...')
              : ((coach.language || i18n.language) === 'ar' ? `رسالة لـ ${coach.name}...` : `Message ${coach.name}...`)
            }
            placeholderTextColor={isRecording ? Colors.error : Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!isRecording}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>{isRTL ? '◄' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles_static = {
  avatarCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { maxWidth: '75%', borderRadius: 20, padding: 12 },
};

function createStyles(Colors, isRTL) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 12, paddingHorizontal: 10,
      backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    headerAvatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.primaryLight, justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0,
      position: 'relative',
    },
    onlineDot: {
      position: 'absolute', bottom: 1, right: 1,
      width: 11, height: 11, borderRadius: 6,
      backgroundColor: '#22C55E', borderWidth: 2, borderColor: Colors.card,
    },
    headerName: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    headerTitle: { fontSize: 12, color: Colors.success, marginTop: 1, fontWeight: '500', textAlign: isRTL ? 'right' : 'left' },
    crisisBtn: {
      backgroundColor: Colors.error + '20', borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: Colors.error + '40'
    },
    crisisBtnText: { fontSize: 16 },
    list: { padding: 16, paddingBottom: 8 },
    sessionBadge: { alignItems: 'center', marginBottom: 16 },
    sessionBadgeText: { fontSize: 11, color: Colors.textMuted, backgroundColor: Colors.border + '60', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
    msgRowUser: { justifyContent: 'flex-end' },
    avatarCircle: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: Colors.primaryLight, justifyContent: 'center',
      alignItems: 'center', marginRight: 6, marginBottom: 16,
    },
    avatarText: { fontSize: 18 },
    userAvatarPlaceholder: { width: 8 },
    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleAI: {
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
      borderBottomLeftRadius: 4,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    bubbleTextUser: { color: '#fff' },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginLeft: 4, marginBottom: 10 },
    timeRowUser: { justifyContent: 'flex-end', marginRight: 4 },
    timeText: { fontSize: 11, color: Colors.textMuted },
    readTick: { fontSize: 11, color: Colors.primary, marginLeft: 4, fontWeight: '700' },
    suggestions: { paddingHorizontal: 16, paddingBottom: 8 },
    suggestionsTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' },
    suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestionChip: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    suggestionText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    disclaimerBanner: {
      backgroundColor: '#FFF8E1', paddingHorizontal: 14, paddingVertical: 6,
      borderBottomWidth: 1, borderBottomColor: '#FFE082',
    },
    disclaimerText: {
      fontSize: 11, color: '#795548', textAlign: 'center', lineHeight: 16,
    },
    limitBanner: {
      backgroundColor: Colors.card, marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 12,
      borderLeftWidth: isRTL ? 0 : 4, borderLeftColor: Colors.warning,
      borderRightWidth: isRTL ? 4 : 0, borderRightColor: Colors.warning,
    },
    limitText: { color: Colors.warning, fontSize: 13, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' },
    errorBox: {
      backgroundColor: Colors.card, margin: 16, padding: 12, borderRadius: 12,
      borderLeftWidth: isRTL ? 0 : 4, borderLeftColor: Colors.error,
      borderRightWidth: isRTL ? 4 : 0, borderRightColor: Colors.error,
    },
    errorText: { color: Colors.error, fontSize: 13, textAlign: isRTL ? 'right' : 'left' },
    transcribingBox: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, padding: 12, marginHorizontal: 12, marginBottom: 6, backgroundColor: Colors.primaryLight, borderRadius: 12 },
    transcribingText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    inputRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row', padding: 10,
      backgroundColor: Colors.card, borderTopWidth: 1,
      borderTopColor: Colors.border, alignItems: 'flex-end', gap: 8,
    },
    micBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    },
    micBtnActive: { backgroundColor: Colors.error + '30' },
    micBtnLocked: { backgroundColor: Colors.border },
    micIcon: { fontSize: 18 },
    input: {
      flex: 1, backgroundColor: Colors.background, borderRadius: 22,
      paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
      color: Colors.text, maxHeight: 100,
      borderWidth: 1, borderColor: Colors.border,
    },
    sendBtn: {
      backgroundColor: Colors.primary, width: 44, height: 44,
      borderRadius: 22, justifyContent: 'center', alignItems: 'center',
      shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
    sendIcon: { color: '#fff', fontSize: 17 },
  });
}
