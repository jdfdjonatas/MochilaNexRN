import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarFeed } from './rss';

const TASK_VERIFICAR_EPISODIOS = 'verificar-novos-episodios';

// Configura comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function solicitarPermissao(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function notificarNovoEpisodio(titulo: string, podcast: string, capa: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎙️ ${podcast}`,
      body: titulo,
      data: { tipo: 'novo_episodio' },
    },
    trigger: null, // imediata
  });
}

// Registra tarefa de background para checar novos episódios
export async function registrarVerificacaoBackground() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_VERIFICAR_EPISODIOS, {
      minimumInterval: 60 * 60, // 1 hora
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.warn('[Notif] Erro ao registrar background fetch:', e);
  }
}

export async function cancelarVerificacaoBackground() {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_VERIFICAR_EPISODIOS);
  } catch {}
}

// Define a tarefa que roda em background
TaskManager.defineTask(TASK_VERIFICAR_EPISODIOS, async () => {
  try {
    const raw = await AsyncStorage.getItem('meusPodcasts');
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;

    const podcasts = JSON.parse(raw);
    const ultimosRaw = await AsyncStorage.getItem('ultimosEpisodios');
    const ultimos: Record<string, string> = ultimosRaw ? JSON.parse(ultimosRaw) : {};

    let novos = 0;
    for (const podcast of podcasts.slice(0, 5)) { // limita a 5 pra não sobrecarregar
      try {
        const feed = await buscarFeed(podcast.url);
        const primeiro = feed.episodios[0];
        if (!primeiro) continue;

        const ultimoId = ultimos[podcast.id];
        if (ultimoId && ultimoId !== primeiro.id) {
          await notificarNovoEpisodio(primeiro.titulo, podcast.nome, podcast.capa);
          novos++;
        }
        ultimos[podcast.id] = primeiro.id;
      } catch {}
    }

    await AsyncStorage.setItem('ultimosEpisodios', JSON.stringify(ultimos));
    return novos > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
