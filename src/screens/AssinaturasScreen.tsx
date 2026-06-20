import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useConfigStore, usePodcastStore, Podcast } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { buscarPodcastItunes } from '../services/rss';
import RadioScreen from './RadioScreen';
import RSSScreen from './RSSScreen';

interface ResultadoItunes {
  collectionId: number;
  collectionName: string;
  artistName: string;
  feedUrl?: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
}

type Aba = 'podcasts' | 'radio' | 'rss';

export default function AssinaturasScreen({ navigation }: any) {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { podcasts, adicionar, remover } = usePodcastStore();

  const [aba, setAba] = useState<Aba>('podcasts');
  const [modoBusca, setModoBusca] = useState(false);
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoItunes[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    if (!termo.trim()) return;
    setBuscando(true);
    try {
      const lista = await buscarPodcastItunes(termo.trim());
      setResultados(lista.filter((r: ResultadoItunes) => !!r.feedUrl));
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar. Verifique sua conexão.');
    } finally {
      setBuscando(false);
    }
  }

  function jaAssinado(feedUrl: string) {
    return podcasts.some((p) => p.url === feedUrl);
  }

  async function assinar(item: ResultadoItunes) {
    if (!item.feedUrl) return;
    await adicionar({
      id: String(item.collectionId),
      nome: item.collectionName,
      url: item.feedUrl,
      capa: item.artworkUrl600 || item.artworkUrl100 || '',
      autor: item.artistName,
      dataAssinatura: new Date().toISOString(),
    });
  }

  function confirmarRemover(podcast: Podcast) {
    Alert.alert('Remover assinatura', `Deixar de seguir "${podcast.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(podcast.id) },
    ]);
  }

  function renderPodcastAssinado({ item }: { item: Podcast }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}
        onPress={() => navigation.navigate('PodcastDetalhe', { podcast: item })}
        onLongPress={() => confirmarRemover(item)}
      >
        <Image source={{ uri: item.capa }} style={styles.capa} />
        <View style={styles.info}>
          <Text style={[styles.nome, { color: tema.texto }]} numberOfLines={1}>{item.nome}</Text>
          {!!item.autor && (
            <Text style={[styles.autor, { color: tema.textoSecundario }]} numberOfLines={1}>{item.autor}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={tema.textoSecundario} />
      </TouchableOpacity>
    );
  }

  function renderResultado({ item }: { item: ResultadoItunes }) {
    const assinado = jaAssinado(item.feedUrl || '');
    return (
      <View style={[styles.card, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}>
        <Image source={{ uri: item.artworkUrl100 }} style={styles.capa} />
        <View style={styles.info}>
          <Text style={[styles.nome, { color: tema.texto }]} numberOfLines={1}>{item.collectionName}</Text>
          <Text style={[styles.autor, { color: tema.textoSecundario }]} numberOfLines={1}>{item.artistName}</Text>
        </View>
        <TouchableOpacity onPress={() => assinar(item)} disabled={assinado}>
          <Ionicons
            name={assinado ? 'checkmark-circle' : 'add-circle-outline'}
            size={28}
            color={assinado ? corDestaque : tema.textoSecundario}
          />
        </TouchableOpacity>
      </View>
    );
  }

  const ABAS: { key: Aba; label: string; icone: string }[] = [
    { key: 'podcasts', label: 'Podcasts', icone: 'mic' },
    { key: 'radio', label: 'Rádio', icone: 'radio' },
    { key: 'rss', label: 'Notícias', icone: 'newspaper' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      {/* Header com abas */}
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.titulo, { color: corDestaque }]}>Assinaturas</Text>
          {aba === 'podcasts' && (
            <TouchableOpacity onPress={() => { setModoBusca(!modoBusca); setResultados([]); setTermo(''); }}>
              <Ionicons name={modoBusca ? 'close' : 'search'} size={24} color={tema.texto} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.abas}>
          {ABAS.map((a) => (
            <TouchableOpacity key={a.key} style={styles.aba} onPress={() => { setAba(a.key); setModoBusca(false); }}>
              <Ionicons
                name={aba === a.key ? a.icone as any : `${a.icone}-outline` as any}
                size={18}
                color={aba === a.key ? corDestaque : tema.textoSecundario}
              />
              <Text style={[styles.abaTexto, { color: aba === a.key ? corDestaque : tema.textoSecundario }]}>
                {a.label}
              </Text>
              {aba === a.key && <View style={[styles.abaLinha, { backgroundColor: corDestaque }]} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conteúdo por aba */}
      {aba === 'podcasts' && (
        <>
          {modoBusca && (
            <View style={[styles.barraBusca, { borderBottomColor: tema.borda }]}>
              <TextInput
                value={termo}
                onChangeText={setTermo}
                onSubmitEditing={buscar}
                placeholder="Buscar podcast..."
                placeholderTextColor={tema.textoSecundario}
                style={[styles.input, { color: tema.texto, backgroundColor: tema.fundoSecundario }]}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={buscar}>
                {buscando
                  ? <ActivityIndicator color={corDestaque} />
                  : <Ionicons name="arrow-forward-circle" size={32} color={corDestaque} />
                }
              </TouchableOpacity>
            </View>
          )}
          <FlatList
            data={modoBusca ? resultados : podcasts}
            keyExtractor={(item: any) => String(item.collectionId || item.id)}
            renderItem={modoBusca ? renderResultado : renderPodcastAssinado}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={[styles.vazio, { color: tema.textoSecundario }]}>
                {modoBusca ? 'Busque por nome do podcast.' : 'Nenhum podcast.\nToque na lupa para buscar.'}
              </Text>
            }
          />
        </>
      )}

      {aba === 'radio' && <RadioScreen />}
      {aba === 'rss' && <RSSScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.sm,
  },
  titulo: { fontSize: FONTES.titulo, fontWeight: 'bold' },
  abas: { flexDirection: 'row' },
  aba: { flex: 1, alignItems: 'center', paddingVertical: ESPACOS.sm, gap: 2 },
  abaTexto: { fontSize: FONTES.pequena, fontWeight: '600' },
  abaLinha: { height: 2, width: '70%', borderRadius: 2, marginTop: 2 },
  barraBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.sm,
    borderBottomWidth: 1,
    gap: ESPACOS.sm,
  },
  input: {
    flex: 1, borderRadius: RAIOS.md,
    paddingHorizontal: ESPACOS.md, paddingVertical: ESPACOS.sm,
    fontSize: FONTES.normal,
  },
  lista: { padding: ESPACOS.lg },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: RAIOS.md,
    padding: ESPACOS.md, marginBottom: ESPACOS.sm,
  },
  capa: { width: 48, height: 48, borderRadius: RAIOS.sm },
  info: { flex: 1, marginLeft: ESPACOS.md },
  nome: { fontSize: FONTES.media, fontWeight: '600' },
  autor: { fontSize: FONTES.pequena, marginTop: 2 },
  vazio: { textAlign: 'center', fontSize: FONTES.normal, marginTop: ESPACOS.xl },
});
