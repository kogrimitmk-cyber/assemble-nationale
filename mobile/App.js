import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';

import { C, F } from './src/theme';
import { I18nProvider, useI18n } from './src/i18n';
import { AuthProvider, useAuth } from './src/auth';

import Accueil from './src/screens/Accueil';
import Agenda from './src/screens/Agenda';
import Lois from './src/screens/Lois';
import LoiDetail from './src/screens/LoiDetail';
import Deputes from './src/screens/Deputes';
import Citoyen from './src/screens/Citoyen';
import Connexion from './src/screens/Connexion';
import Espace from './src/screens/Espace';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONES = { Accueil: 'home', Agenda: 'calendar', Lois: 'document-text', Deputes: 'people', Citoyen: 'chatbubbles' };

function BoutonsEntete({ navigation }) {
  const { t, toggle } = useI18n();
  const { utilisateur } = useAuth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable onPress={toggle} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
        <Text style={{ color: '#fff', fontFamily: F.sansBold, fontSize: 13 }}>{t('commun.langue')}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate(utilisateur ? 'Espace' : 'Connexion')} hitSlop={8} style={{ padding: 6 }}>
        <Ionicons name={utilisateur ? 'person-circle' : 'person-circle-outline'} size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

function Onglets() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerStyle: { backgroundColor: C.blue800 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: F.serifBold, fontSize: 19 },
        headerTitleAlign: 'center',
        headerRight: () => <BoutonsEntete navigation={navigation} />,
        headerRightContainerStyle: { paddingRight: 12 },
        tabBarActiveTintColor: C.blue800,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.sansMed, fontSize: 11 },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Accueil" component={Accueil} options={{ title: t('tab.accueil'), headerTitle: t('marque.nom') }} />
      <Tab.Screen name="Agenda" component={Agenda} options={{ title: t('tab.agenda') }} />
      <Tab.Screen name="Lois" component={Lois} options={{ title: t('tab.lois') }} />
      <Tab.Screen name="Deputes" component={Deputes} options={{ title: t('tab.deputes') }} />
      <Tab.Screen name="Citoyen" component={Citoyen} options={{ title: t('tab.citoyen') }} />
    </Tab.Navigator>
  );
}

function Racine() {
  const { t } = useI18n();
  const enteteBleue = { headerStyle: { backgroundColor: C.blue800 }, headerTintColor: '#fff', headerTitleStyle: { fontFamily: F.serifBold } };
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Onglets" component={Onglets} options={{ headerShown: false }} />
        <Stack.Screen name="LoiDetail" component={LoiDetail} options={{ ...enteteBleue, title: t('tab.lois') }} />
        <Stack.Screen name="Connexion" component={Connexion} options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="Espace" component={Espace} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [pretes, erreur] = useFonts({
    [F.sans]: DMSans_400Regular, [F.sansMed]: DMSans_500Medium, [F.sansBold]: DMSans_700Bold,
    [F.serif]: CormorantGaramond_600SemiBold, [F.serifBold]: CormorantGaramond_700Bold,
  });
  if (!pretes && !erreur) return <View style={{ flex: 1, backgroundColor: C.blue800 }} />;

  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Racine />
      </AuthProvider>
    </I18nProvider>
  );
}
