import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVES_BACKUP = [
  'meusPodcasts',
  'minhasRadios',
  'meusFeedsRSS',
  'episodiosBaixados',
  'episodiosGuardados',
  'temaMochilaNex',
  'corDestaqueMochilaNex',
];

export interface DadosBackup {
  versao: string;
  data: string;
  dados: Record<string, any>;
}

export async function exportarBackup(): Promise<void> {
  const dados: Record<string, any> = {};
  for (const chave of CHAVES_BACKUP) {
    const valor = await AsyncStorage.getItem(chave);
    if (valor) dados[chave] = JSON.parse(valor);
  }

  const backup: DadosBackup = {
    versao: '2.0',
    data: new Date().toISOString(),
    dados,
  };

  const json = JSON.stringify(backup, null, 2);
  const caminho = FileSystem.documentDirectory + `mochilanex_backup_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(caminho, json, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(caminho, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do MochilaNex',
    });
  }
}

export async function importarBackup(conteudo: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const backup: DadosBackup = JSON.parse(conteudo);
    if (!backup.dados) return { sucesso: false, mensagem: 'Arquivo de backup inválido.' };

    for (const [chave, valor] of Object.entries(backup.dados)) {
      await AsyncStorage.setItem(chave, JSON.stringify(valor));
    }

    return { sucesso: true, mensagem: `Backup de ${new Date(backup.data).toLocaleDateString('pt-BR')} restaurado com sucesso!` };
  } catch {
    return { sucesso: false, mensagem: 'Erro ao ler o arquivo. Verifique se é um backup válido.' };
  }
}

// Importa dados do MochilaNex WebView (formato antigo)
export async function importarMochilaNexAntigo(conteudo: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const dados = JSON.parse(conteudo);
    let importados = 0;

    // Podcasts
    if (dados.podcasts || dados.meusPodcasts) {
      const lista = dados.podcasts || dados.meusPodcasts;
      await AsyncStorage.setItem('meusPodcasts', JSON.stringify(lista));
      importados += lista.length;
    }

    // Rádios
    if (dados.radios || dados.minhasRadios) {
      const lista = dados.radios || dados.minhasRadios;
      await AsyncStorage.setItem('minhasRadios', JSON.stringify(lista));
      importados += lista.length;
    }

    // Feeds RSS
    if (dados.feeds || dados.meusFeedsRSS) {
      const lista = dados.feeds || dados.meusFeedsRSS;
      await AsyncStorage.setItem('meusFeedsRSS', JSON.stringify(lista));
      importados += lista.length;
    }

    return { sucesso: true, mensagem: `${importados} itens importados do MochilaNex!` };
  } catch {
    return { sucesso: false, mensagem: 'Formato não reconhecido. Exporte os dados do MochilaNex original primeiro.' };
  }
}
