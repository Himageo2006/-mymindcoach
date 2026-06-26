import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Show notifications while the app is foregrounded too
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

const DAILY = Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily';
const DATE  = Notifications.SchedulableTriggerInputTypes?.DATE  ?? 'date';

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
      });
    } catch {}
  }
}

const NOTIF_ENABLED_KEY = 'notifications_enabled';
const NOTIF_HOUR_KEY = 'notifications_hour';
const NOTIF_MINUTE_KEY = 'notifications_minute';

const REMINDER_MESSAGES = {
  en: [
    "How are you feeling today? 💙 Take a moment to check in.",
    "Your mental wellness matters. 🧠 Your coach is here to listen.",
    "A few minutes of reflection can change your whole day. ✨",
    "Remember to breathe. 🌊 Open MyMindCoach for a quick check-in.",
    "You've got this! 💪 How's your mood today?",
    "Small steps every day lead to big changes. 🌱 Check in now.",
    "Taking care of your mind is the best investment. 💜 How are you?",
  ],
  ar: [
    "كيف حالك اليوم؟ 💙 خصص لحظة للتحقق من مشاعرك.",
    "صحتك النفسية مهمة. 🧠 مدربك هنا للاستماع إليك.",
    "بضع دقائق من التأمل ممكن تغير يومك كله. ✨",
    "تذكر أن تتنفس. 🌊 افتح MyMindCoach للتسجيل السريع.",
    "أنت قادر على ذلك! 💪 كيف مزاجك اليوم؟",
    "خطوات صغيرة كل يوم تؤدي لتغييرات كبيرة. 🌱 سجّل الآن.",
    "الاهتمام بعقلك هو أفضل استثمار. 💜 كيف حالك؟",
  ],
  es: [
    "¿Cómo te sientes hoy? 💙 Tómate un momento para reflexionar.",
    "Tu bienestar mental importa. 🧠 Tu coach está aquí para escucharte.",
    "Unos minutos de reflexión pueden cambiar todo tu día. ✨",
    "Recuerda respirar. 🌊 Abre MyMindCoach para un chequeo rápido.",
    "¡Tú puedes! 💪 ¿Cómo está tu estado de ánimo hoy?",
    "Pequeños pasos cada día llevan a grandes cambios. 🌱 Regístrate ahora.",
    "Cuidar tu mente es la mejor inversión. 💜 ¿Cómo estás?",
  ],
  fr: [
    "Comment vous sentez-vous aujourd'hui? 💙 Prenez un moment pour faire le point.",
    "Votre bien-être mental est important. 🧠 Votre coach est là pour vous écouter.",
    "Quelques minutes de réflexion peuvent changer toute votre journée. ✨",
    "N'oubliez pas de respirer. 🌊 Ouvrez MyMindCoach pour un bilan rapide.",
    "Vous pouvez le faire! 💪 Comment est votre humeur aujourd'hui?",
    "De petits pas chaque jour mènent à de grands changements. 🌱 Faites le point maintenant.",
    "Prendre soin de votre esprit est le meilleur investissement. 💜 Comment allez-vous?",
  ],
  de: [
    "Wie geht es dir heute? 💙 Nimm dir einen Moment zum Innehalten.",
    "Deine mentale Gesundheit ist wichtig. 🧠 Dein Coach ist hier zum Zuhören.",
    "Ein paar Minuten Reflexion können deinen ganzen Tag verändern. ✨",
    "Denk daran zu atmen. 🌊 Öffne MyMindCoach für ein schnelles Check-in.",
    "Du schaffst das! 💪 Wie ist deine Stimmung heute?",
    "Kleine Schritte jeden Tag führen zu großen Veränderungen. 🌱 Check jetzt ein.",
    "Auf deinen Geist zu achten ist die beste Investition. 💜 Wie geht es dir?",
  ],
  pt: [
    "Como você está se sentindo hoje? 💙 Reserve um momento para refletir.",
    "Seu bem-estar mental importa. 🧠 Seu coach está aqui para ouvir.",
    "Alguns minutos de reflexão podem mudar todo o seu dia. ✨",
    "Lembre-se de respirar. 🌊 Abra o MyMindCoach para um check-in rápido.",
    "Você consegue! 💪 Como está seu humor hoje?",
    "Pequenos passos todos os dias levam a grandes mudanças. 🌱 Registre-se agora.",
    "Cuidar da sua mente é o melhor investimento. 💜 Como você está?",
  ],
  it: [
    "Come ti senti oggi? 💙 Prenditi un momento per riflettere.",
    "Il tuo benessere mentale è importante. 🧠 Il tuo coach è qui per ascoltarti.",
    "Pochi minuti di riflessione possono cambiare tutta la tua giornata. ✨",
    "Ricordati di respirare. 🌊 Apri MyMindCoach per un rapido check-in.",
    "Ce la fai! 💪 Come è il tuo umore oggi?",
    "Piccoli passi ogni giorno portano a grandi cambiamenti. 🌱 Fai il check-in ora.",
    "Prendersi cura della propria mente è il miglior investimento. 💜 Come stai?",
  ],
  ru: [
    "Как вы себя чувствуете сегодня? 💙 Уделите момент для рефлексии.",
    "Ваше психическое здоровье важно. 🧠 Ваш коуч здесь, чтобы слушать.",
    "Несколько минут размышлений могут изменить весь ваш день. ✨",
    "Не забудьте дышать. 🌊 Откройте MyMindCoach для быстрой проверки.",
    "У вас получится! 💪 Какое у вас настроение сегодня?",
    "Маленькие шаги каждый день ведут к большим переменам. 🌱 Отметьтесь сейчас.",
    "Забота о своём уме — лучшая инвестиция. 💜 Как вы?",
  ],
  hi: [
    "आज आप कैसा महसूस कर रहे हैं? 💙 एक पल के लिए रुकें।",
    "आपका मानसिक स्वास्थ्य महत्वपूर्ण है। 🧠 आपका कोच सुनने के लिए यहाँ है।",
    "कुछ मिनट की सोच आपका पूरा दिन बदल सकती है। ✨",
    "सांस लेना याद रखें। 🌊 त्वरित चेक-इन के लिए MyMindCoach खोलें।",
    "आप यह कर सकते हैं! 💪 आज आपका मूड कैसा है?",
    "हर दिन छोटे कदम बड़े बदलाव लाते हैं। 🌱 अभी चेक इन करें।",
    "मन की देखभाल सबसे अच्छा निवेश है। 💜 आप कैसे हैं?",
  ],
  id: [
    "Bagaimana perasaan Anda hari ini? 💙 Luangkan waktu sejenak untuk refleksi.",
    "Kesehatan mental Anda penting. 🧠 Pelatih Anda siap mendengarkan.",
    "Beberapa menit refleksi bisa mengubah seluruh hari Anda. ✨",
    "Ingat untuk bernapas. 🌊 Buka MyMindCoach untuk check-in cepat.",
    "Anda bisa! 💪 Bagaimana suasana hati Anda hari ini?",
    "Langkah kecil setiap hari mengarah pada perubahan besar. 🌱 Check-in sekarang.",
    "Merawat pikiran adalah investasi terbaik. 💜 Apa kabar?",
  ],
  ko: [
    "오늘 기분이 어떠세요? 💙 잠시 체크인할 시간을 가져보세요.",
    "당신의 정신 건강이 중요합니다. 🧠 코치가 여기서 듣고 있습니다.",
    "몇 분간의 성찰이 하루를 바꿀 수 있어요. ✨",
    "호흡을 잊지 마세요. 🌊 빠른 체크인을 위해 MyMindCoach를 열어보세요.",
    "할 수 있어요! 💪 오늘 기분은 어떤가요?",
    "매일 작은 걸음이 큰 변화를 만들어요. 🌱 지금 체크인하세요.",
    "마음을 돌보는 것이 최고의 투자입니다. 💜 어떻게 지내세요?",
  ],
  ja: [
    "今日はどんな気分ですか？ 💙 少し立ち止まって自分をチェックしましょう。",
    "あなたのメンタルヘルスは大切です。 🧠 コーチがここで聴いています。",
    "数分の振り返りが一日を変えることができます。 ✨",
    "呼吸を忘れずに。 🌊 MyMindCoachを開いてクイックチェックインしましょう。",
    "あなたならできます！ 💪 今日の気分はいかがですか？",
    "毎日の小さな一歩が大きな変化につながります。 🌱 今すぐチェックインしましょう。",
    "心を大切にすることが最高の投資です。 💜 お元気ですか？",
  ],
  zh: [
    "今天感觉怎么样？ 💙 花点时间做个自我检查。",
    "您的心理健康很重要。 🧠 您的教练在这里倾听。",
    "几分钟的反思可以改变您的整个一天。 ✨",
    "记得呼吸。 🌊 打开MyMindCoach进行快速签到。",
    "您能做到！ 💪 今天您的心情怎么样？",
    "每天一小步带来大改变。 🌱 立即签到。",
    "照顾好自己的心灵是最好的投资。 💜 您好吗？",
  ],
  tr: [
    "Bugün nasıl hissediyorsunuz? 💙 Kendinizi kontrol etmek için bir dakika ayırın.",
    "Ruh sağlığınız önemli. 🧠 Koçunuz dinlemek için burada.",
    "Birkaç dakikalık düşünce tüm gününüzü değiştirebilir. ✨",
    "Nefes almayı unutmayın. 🌊 Hızlı bir giriş için MyMindCoach'u açın.",
    "Başarabilirsiniz! 💪 Bugün ruh haliniz nasıl?",
    "Her gün atılan küçük adımlar büyük değişimlere yol açar. 🌱 Şimdi giriş yapın.",
    "Zihninize iyi bakmak en iyi yatırımdır. 💜 Nasılsınız?",
  ],
  fa: [
    "امروز چه احساسی دارید؟ 💙 لحظه‌ای برای بررسی خود وقت بگذارید.",
    "سلامت روان شما مهم است. 🧠 مربی شما اینجاست تا گوش دهد.",
    "چند دقیقه تأمل می‌تواند کل روز شما را تغییر دهد. ✨",
    "یادتان باشد نفس بکشید. 🌊 MyMindCoach را برای ورود سریع باز کنید.",
    "شما می‌توانید! 💪 امروز حال‌تان چطور است؟",
    "قدم‌های کوچک هر روز به تغییرات بزرگ منجر می‌شوند. 🌱 همین الان وارد شوید.",
    "مراقبت از ذهن بهترین سرمایه‌گذاری است. 💜 حال شما چطور است؟",
  ],
  nl: [
    "Hoe voel je je vandaag? 💙 Neem even de tijd om bij jezelf in te checken.",
    "Jouw mentale welzijn is belangrijk. 🧠 Jouw coach is hier om te luisteren.",
    "Een paar minuten reflectie kan je hele dag veranderen. ✨",
    "Vergeet niet te ademen. 🌊 Open MyMindCoach voor een snelle check-in.",
    "Jij kunt dit! 💪 Hoe is jouw stemming vandaag?",
    "Kleine stappen elke dag leiden tot grote veranderingen. 🌱 Check nu in.",
    "Zorgen voor je geest is de beste investering. 💜 Hoe gaat het?",
  ],
  pl: [
    "Jak się dzisiaj czujesz? 💙 Poświęć chwilę na refleksję.",
    "Twoje zdrowie psychiczne jest ważne. 🧠 Twój coach jest tutaj, aby słuchać.",
    "Kilka minut refleksji może zmienić cały twój dzień. ✨",
    "Pamiętaj o oddychaniu. 🌊 Otwórz MyMindCoach na szybki check-in.",
    "Dasz radę! 💪 Jaki jest twój nastrój dzisiaj?",
    "Małe kroki każdego dnia prowadzą do wielkich zmian. 🌱 Zamelduj się teraz.",
    "Dbanie o umysł to najlepsza inwestycja. 💜 Jak się masz?",
  ],
  th: [
    "วันนี้คุณรู้สึกอย่างไรบ้าง? 💙 ใช้เวลาสักครู่เพื่อตรวจสอบตัวเอง",
    "สุขภาพจิตของคุณสำคัญมาก 🧠 โค้ชของคุณพร้อมรับฟัง",
    "การใช้เวลาไม่กี่นาทีในการทบทวนตัวเองสามารถเปลี่ยนทั้งวันได้ ✨",
    "อย่าลืมหายใจ 🌊 เปิด MyMindCoach เพื่อ check-in อย่างรวดเร็ว",
    "คุณทำได้! 💪 อารมณ์ของคุณวันนี้เป็นอย่างไร?",
    "ก้าวเล็กๆ ทุกวันนำไปสู่การเปลี่ยนแปลงครั้งใหญ่ 🌱 check-in เดี๋ยวนี้เลย",
    "การดูแลจิตใจคือการลงทุนที่ดีที่สุด 💜 คุณเป็นอย่างไรบ้าง?",
  ],
  vi: [
    "Hôm nay bạn cảm thấy thế nào? 💙 Dành chút thời gian để tự kiểm tra.",
    "Sức khỏe tâm thần của bạn quan trọng. 🧠 Huấn luyện viên của bạn đang lắng nghe.",
    "Vài phút suy ngẫm có thể thay đổi cả ngày của bạn. ✨",
    "Nhớ thở đều. 🌊 Mở MyMindCoach để check-in nhanh.",
    "Bạn có thể làm được! 💪 Tâm trạng của bạn hôm nay thế nào?",
    "Những bước nhỏ mỗi ngày dẫn đến những thay đổi lớn. 🌱 Check-in ngay bây giờ.",
    "Chăm sóc tâm trí là khoản đầu tư tốt nhất. 💜 Bạn có khỏe không?",
  ],
  ms: [
    "Bagaimana perasaan anda hari ini? 💙 Luangkan masa sebentar untuk merenung.",
    "Kesihatan mental anda penting. 🧠 Jurulatih anda sedia mendengar.",
    "Beberapa minit refleksi boleh mengubah seluruh hari anda. ✨",
    "Ingat untuk bernafas. 🌊 Buka MyMindCoach untuk daftar masuk pantas.",
    "Anda boleh buat! 💪 Bagaimana mood anda hari ini?",
    "Langkah kecil setiap hari membawa perubahan besar. 🌱 Daftar masuk sekarang.",
    "Menjaga minda adalah pelaburan terbaik. 💜 Apa khabar?",
  ],
  uk: [
    "Як ви себе почуваєте сьогодні? 💙 Приділіть хвилину для самоперевірки.",
    "Ваше психічне здоров'я важливе. 🧠 Ваш коуч тут, щоб слухати.",
    "Кілька хвилин роздумів можуть змінити весь ваш день. ✨",
    "Пам'ятайте дихати. 🌊 Відкрийте MyMindCoach для швидкого check-in.",
    "У вас вийде! 💪 Який у вас настрій сьогодні?",
    "Маленькі кроки щодня ведуть до великих змін. 🌱 Відзначтесь зараз.",
    "Турбота про розум — найкраща інвестиція. 💜 Як ви?",
  ],
};

const NOTIF_TITLES = {
  en: '🧠 MyMindCoach',
  ar: '🧠 مدربك اليوم',
  es: '🧠 MyMindCoach',
  fr: '🧠 MyMindCoach',
  de: '🧠 MyMindCoach',
  pt: '🧠 MyMindCoach',
  it: '🧠 MyMindCoach',
  ru: '🧠 MyMindCoach',
  hi: '🧠 MyMindCoach',
  id: '🧠 MyMindCoach',
  ko: '🧠 MyMindCoach',
  ja: '🧠 MyMindCoach',
  zh: '🧠 MyMindCoach',
  tr: '🧠 MyMindCoach',
  fa: '🧠 MyMindCoach',
  nl: '🧠 MyMindCoach',
  pl: '🧠 MyMindCoach',
  th: '🧠 MyMindCoach',
  vi: '🧠 MyMindCoach',
  ms: '🧠 MyMindCoach',
  uk: '🧠 MyMindCoach',
};

function getRandomMessage(lang) {
  const messages = REMINDER_MESSAGES[lang] || REMINDER_MESSAGES.en;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Real scheduling (expo-notifications) ────────────────────────────────────

const WINBACK = {
  en: ["Your coach is here whenever you're ready. 💙", "It's been a couple of days — how are you feeling? 🌱"],
  ar: ["مدربك هنا في أي وقت تكون جاهز. 💙", "عدّى كام يوم — إزاي مشاعرك؟ 🌱"],
  es: ["Tu coach está aquí cuando estés listo. 💙", "Han pasado unos días, ¿cómo te sientes? 🌱"],
  fr: ["Votre coach est là quand vous voulez. 💙", "Ça fait quelques jours — comment allez-vous? 🌱"],
};
const winbackMsgs = (lang) => WINBACK[lang] || WINBACK.en;

export async function requestNotificationPermission() {
  try {
    await ensureAndroidChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const { status: s2 } = await Notifications.requestPermissionsAsync();
    return s2 === 'granted';
  } catch {
    return false;
  }
}

export async function isNotificationsEnabled() {
  return (await AsyncStorage.getItem(NOTIF_ENABLED_KEY)) === 'true';
}

export async function getNotificationTime() {
  const hour = parseInt(await AsyncStorage.getItem(NOTIF_HOUR_KEY) || '9');
  const minute = parseInt(await AsyncStorage.getItem(NOTIF_MINUTE_KEY) || '0');
  return { hour, minute };
}

// Schedules the daily check-in reminder + arms win-back nudges. Returns true if scheduled.
export async function scheduleDaily(hour, minute, lang = 'en') {
  const ok = await requestNotificationPermission();
  if (!ok) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: NOTIF_TITLES[lang] || NOTIF_TITLES.en, body: getRandomMessage(lang) },
    trigger: { type: DAILY, hour, minute },
  });
  await AsyncStorage.multiSet([[NOTIF_ENABLED_KEY, 'true'], [NOTIF_HOUR_KEY, String(hour)], [NOTIF_MINUTE_KEY, String(minute)]]);
  await scheduleWinBack(lang);
  return true;
}

export async function cancelNotifications() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
}

// Win-back nudges fire only if the user does NOT reopen the app (re-armed each open).
export async function scheduleWinBack(lang = 'en') {
  const msgs = winbackMsgs(lang);
  const days = [2, 4];
  for (let i = 0; i < days.length; i++) {
    await Notifications.scheduleNotificationAsync({
      content: { title: NOTIF_TITLES[lang] || NOTIF_TITLES.en, body: msgs[i] || msgs[0] },
      trigger: { type: DATE, date: new Date(Date.now() + days[i] * 86400000) },
    });
  }
}

// Call on every app open: re-arms the daily + pushes the win-back nudges out
// (so they only fire for users who actually stayed away). No-op if disabled.
export async function refreshEngagement(lang = 'en') {
  if (!(await isNotificationsEnabled())) return;
  const ok = await requestNotificationPermission();
  if (!ok) return;
  const { hour, minute } = await getNotificationTime();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: NOTIF_TITLES[lang] || NOTIF_TITLES.en, body: getRandomMessage(lang) },
    trigger: { type: DAILY, hour, minute },
  });
  await scheduleWinBack(lang);
}
