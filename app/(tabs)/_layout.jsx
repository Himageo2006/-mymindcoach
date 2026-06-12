import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab label translations (kept inline — tiny, no extra file needed)
const TAB_LABELS = {
  en: { home: 'Home', chat: 'Chat', journal: 'Journal', insights: 'Insights', settings: 'Settings' },
  ar: { home: 'الرئيسية', chat: 'المحادثة', journal: 'مذكراتي', insights: 'تحليلات', settings: 'الإعدادات' },
  fa: { home: 'خانه', chat: 'چت', journal: 'دفترچه', insights: 'تحلیل', settings: 'تنظیمات' },
  es: { home: 'Inicio', chat: 'Chat', journal: 'Diario', insights: 'Análisis', settings: 'Ajustes' },
  fr: { home: 'Accueil', chat: 'Chat', journal: 'Journal', insights: 'Stats', settings: 'Réglages' },
  de: { home: 'Startseite', chat: 'Chat', journal: 'Tagebuch', insights: 'Statistik', settings: 'Einstellungen' },
  tr: { home: 'Ana Sayfa', chat: 'Sohbet', journal: 'Günlük', insights: 'İstatistik', settings: 'Ayarlar' },
  pt: { home: 'Início', chat: 'Chat', journal: 'Diário', insights: 'Insights', settings: 'Configurações' },
  ru: { home: 'Главная', chat: 'Чат', journal: 'Дневник', insights: 'Статистика', settings: 'Настройки' },
  it: { home: 'Home', chat: 'Chat', journal: 'Diario', insights: 'Statistiche', settings: 'Impostazioni' },
  zh: { home: '主页', chat: '聊天', journal: '日记', insights: '统计', settings: '设置' },
  ja: { home: 'ホーム', chat: 'チャット', journal: '日記', insights: '統計', settings: '設定' },
  ko: { home: '홈', chat: '채팅', journal: '일기', insights: '통계', settings: '설정' },
  hi: { home: 'होम', chat: 'चैट', journal: 'डायरी', insights: 'आंकड़े', settings: 'सेटिंग' },
};

export default function TabLayout() {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 390, height: '100%', maxHeight: 844, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 50 }}>
          <TabsContent />
        </View>
      </View>
    );
  }
  return <TabsContent />;
}

function TabsContent() {
  const Colors = useColors();
  const { i18n } = useTranslation();
  const tl = TAB_LABELS[i18n.language] || TAB_LABELS.en;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tl.home,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: tl.chat,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: tl.journal,
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: tl.insights,
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: tl.settings,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
