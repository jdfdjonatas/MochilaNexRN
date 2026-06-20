import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { usePlayerStore, useDownloadStore } from '../store';

let jaConfigurado = false;

// ---- Setup inicial do player nativo (MediaSession + foreground service) ----
// Chamado uma única vez, no boot do app (App.tsx)
export async function configurarPlayer() {
  if (jaConfigurado) return;

  await TrackPlayer.setupPlayer({
    autoHandleInterruptions: true, // pausa em ligações, outros apps de áudio, etc.
  });

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.JumpForward, Capability.JumpBackward],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    progressUpdateEventInterval: 1, // segundos — alimenta o store com tempo atual
    forwardJumpInterval: 30,
    backwardJumpInterval: 15,
  });

  await TrackPlayer.setRepeatMode(RepeatMode.Off);

  jaConfigurado = true;
}

// ---- Tocar um episódio (busca arquivo local se já tiver sido baixado) ----
export async function tocarEpisodio(episodio: {
  id: string;
  titulo: string;
  url: string;
  capa: string;
  podcastNome?: string;
}) {
  // Se o episódio já foi baixado, toca o arquivo local em vez de streaming
  const downloads = useDownloadStore.getState().downloads;
  const baixado = downloads.find((d) => d.id === episodio.id && d.offline);
  const urlFinal = baixado?.caminhoLocal || episodio.url;

  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: episodio.id,
    url: urlFinal,
    title: episodio.titulo,
    artist: episodio.podcastNome || 'MochilaNex',
    artwork: episodio.capa,
  });
  await TrackPlayer.play();

  usePlayerStore.getState().setEstado({
    url: urlFinal,
    titulo: episodio.titulo,
    subtitulo: episodio.podcastNome || '',
    capa: episodio.capa,
    tocando: true,
    tempo: 0,
    duracao: 0,
    velocidade: 1,
  });
}

export async function alternarPlayPause() {
  const estado = await TrackPlayer.getPlaybackState();
  if (estado.state === State.Playing) {
    await TrackPlayer.pause();
    usePlayerStore.getState().setTocando(false);
  } else {
    await TrackPlayer.play();
    usePlayerStore.getState().setTocando(true);
  }
}

export async function avancar30s() {
  await TrackPlayer.seekBy(30);
}

export async function voltar15s() {
  await TrackPlayer.seekBy(-15);
}

export async function irPara(segundos: number) {
  await TrackPlayer.seekTo(segundos);
}

export async function definirVelocidade(velocidade: number) {
  await TrackPlayer.setRate(velocidade);
  const estado = usePlayerStore.getState().estado;
  if (estado) {
    usePlayerStore.getState().setEstado({ ...estado, velocidade });
  }
}

export async function pararPlayer() {
  await TrackPlayer.reset();
  usePlayerStore.getState().setEstado(null);
}

// ---- Service registrado em index.js / App — mantém eventos remotos sincronizados ----
// (controles na tela de bloqueio chamam estas funções via remote events)
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteJumpForward, () => TrackPlayer.seekBy(30));
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, () => TrackPlayer.seekBy(-15));
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (dados) => {
    usePlayerStore.getState().setTempo(dados.position);
    usePlayerStore.getState().setDuracao(dados.duration);
  });

  TrackPlayer.addEventListener(Event.PlaybackState, (dados) => {
    usePlayerStore.getState().setTocando(dados.state === State.Playing);
  });
}
