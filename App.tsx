import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NavegacaoPrincipal from './src/navigation';
import { configurarPlayer } from './src/services/player';
import {
  useConfigStore,
  usePodcastStore,
  useRadioStore,
  useFeedStore,
  useDownloadStore,
} from './src/store';

export default function App() {
  const { carregar: carregarConfig, temaEscuro } = useConfigStore();
  const { carregar: carregarPodcasts } = usePodcastStore();
  const { carregar: carregarRadios } = useRadioStore();
  const { carregar: carregarFeeds } = useFeedStore();
  const { carregar: carregarDownloads } = useDownloadStore();

  useEffect(() => {
    // Carrega todos os dados salvos ao iniciar
    Promise.all([
      carregarConfig(),
      carregarPodcasts(),
      carregarRadios(),
      carregarFeeds(),
      carregarDownloads(),
    ]);

    // Inicializa o player nativo (MediaSession + foreground service)
    configurarPlayer().catch((erro) =>
      console.warn('[Player] Falha ao configurar:', erro)
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={temaEscuro ? 'light' : 'dark'} />
          <NavegacaoPrincipal />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
