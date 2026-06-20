import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore } from '../store';
import { CORES } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import AssinaturasScreen from '../screens/AssinaturasScreen';
import PodcastDetalheScreen from '../screens/PodcastDetalheScreen';
import RecentesScreen from '../screens/RecentesScreen';
import BaixadosScreen from '../screens/BaixadosScreen';
import GuardadosScreen from '../screens/GuardadosScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';
import MiniPlayerBar from '../components/MiniPlayerBar';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const AssinaturasStackNav = createStackNavigator();

function AssinaturasStack() {
  return (
    <AssinaturasStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AssinaturasStackNav.Screen name="ListaAssinaturas" component={AssinaturasScreen} />
      <AssinaturasStackNav.Screen name="PodcastDetalhe" component={PodcastDetalheScreen} />
    </AssinaturasStackNav.Navigator>
  );
}

function TabsComPlayer() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tema.fundoCard,
            borderTopColor: tema.borda,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: corDestaque,
          tabBarInactiveTintColor: tema.textoSecundario,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              Início: ['home', 'home-outline'],
              Assinaturas: ['library', 'library-outline'],
              Recentes: ['time', 'time-outline'],
              Baixados: ['download', 'download-outline'],
              Guardados: ['bookmark', 'bookmark-outline'],
            };
            const [ativo, inativo] = icons[route.name] || ['ellipse', 'ellipse-outline'];
            return <Ionicons name={(focused ? ativo : inativo) as any} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Início" component={HomeScreen} />
        <Tab.Screen name="Assinaturas" component={AssinaturasStack} />
        <Tab.Screen name="Recentes" component={RecentesScreen} />
        <Tab.Screen name="Baixados" component={BaixadosScreen} />
        <Tab.Screen name="Guardados" component={GuardadosScreen} />
      </Tab.Navigator>
      <MiniPlayerBar />
    </View>
  );
}

export default function NavegacaoPrincipal() {
  const { temaEscuro } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: tema.fundo } }}>
      <RootStack.Screen name="Tabs" component={TabsComPlayer} />
      <RootStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
    </RootStack.Navigator>
  );
}
