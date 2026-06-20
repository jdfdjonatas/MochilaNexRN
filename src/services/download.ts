import * as FileSystem from 'expo-file-system';
import { useDownloadStore } from '../store';

const PASTA_DOWNLOADS = FileSystem.documentDirectory + 'MochilaNexAudios/';

export async function garantirPasta() {
  const info = await FileSystem.getInfoAsync(PASTA_DOWNLOADS);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PASTA_DOWNLOADS, { intermediates: true });
  }
}

export async function baixarEpisodio(
  id: string,
  url: string,
  titulo: string,
  capa: string,
  podcastNome: string,
  podcastUrl: string
) {
  await garantirPasta();

  const nomeArquivo = titulo
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .substring(0, 60)
    .replace(/ /g, '_') + '_' + Date.now() + '.mp3';

  const caminhoLocal = PASTA_DOWNLOADS + nomeArquivo;
  const store = useDownloadStore.getState();

  // Registra o download com progresso 0
  store.adicionar({
    id,
    titulo,
    url: caminhoLocal,
    urlOriginal: url,
    capa,
    data: new Date().toLocaleDateString('pt-BR'),
    podcastNome,
    podcastUrl,
    offline: false,
    caminhoLocal,
    progresso: 0,
  });

  // Download nativo via expo-file-system — sem CORS, sem WebView
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    caminhoLocal,
    {
      headers: {
        'User-Agent': 'MochilaNex/1.0 (Android; Mobile) PodcastApp',
      },
    },
    (prog) => {
      const pct = prog.totalBytesExpectedToWrite > 0
        ? Math.round((prog.totalBytesWritten / prog.totalBytesExpectedToWrite) * 100)
        : 0;
      store.atualizar(id, { progresso: pct });
    }
  );

  try {
    const resultado = await downloadResumable.downloadAsync();
    if (resultado?.uri) {
      store.atualizar(id, {
        offline: true,
        caminhoLocal: resultado.uri,
        progresso: 100,
      });
      // Persiste no AsyncStorage
      const { downloads } = useDownloadStore.getState();
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('episodiosBaixados', JSON.stringify(downloads));
      return resultado.uri;
    }
  } catch (erro) {
    console.error('[Download] Erro:', erro);
    store.remover(id);
    throw erro;
  }
}

export async function removerArquivo(caminhoLocal: string) {
  try {
    const info = await FileSystem.getInfoAsync(caminhoLocal);
    if (info.exists) {
      await FileSystem.deleteAsync(caminhoLocal);
    }
  } catch (e) {
    console.warn('[Download] Erro ao remover arquivo:', e);
  }
}

export async function calcularEspacoUsado(): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(PASTA_DOWNLOADS);
    if (!info.exists) return '0 MB';
    const lista = await FileSystem.readDirectoryAsync(PASTA_DOWNLOADS);
    let total = 0;
    for (const arq of lista) {
      const inf = await FileSystem.getInfoAsync(PASTA_DOWNLOADS + arq, { size: true });
      if (inf.exists && 'size' in inf) total += inf.size || 0;
    }
    const mb = total / 1024 / 1024;
    return mb > 1024
      ? `${(mb / 1024).toFixed(1)} GB`
      : `${mb.toFixed(1)} MB`;
  } catch {
    return '0 MB';
  }
}
