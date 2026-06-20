import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, ScrollView, Linking,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useConfigStore, useFeedStore } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { buscarFeedNoticias, ArtigoRSS, formatarDataArtigo } from '../services/rssNews';

// Feeds sugeridos para o usuário começar
const FEEDS_SUGERIDOS = [
  { nome: 'G1 - Últimas Notícias', url: 'https://g1.globo.com/rss/g1/' },
  { nome: 'UOL Notícias', url: 'https://rss.uol.com.br/feed/noticias.xml' },
  { nome: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
  { nome: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml' },
  { nome: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
];

export default function RSSScreen() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { feeds, adicionar, remover, carregar } = useFeedStore();

  const [aba, setAba] = useState<'artigos' | 'feeds'>('artigos');
  const [artigos, setArtigos] = useState<ArtigoRSS[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [artigoAberto, setArtigoAberto] = useState<ArtigoRSS | null>(null);
  const [modalAddFeed, setModalAddFeed] = useState(false);
  const [novaUrl, setNovaUrl] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (feeds.length > 0) carregarArtigos();
  }, [feeds]);

  async function carregarArtigos() {
    setCarregando(true);
    try {
      const todos: ArtigoRSS[] = [];
      await Promise.allSettled(
        feeds.map(async (feed) => {
          try {
            const info = await buscarFeedNoticias(feed.url);
            todos.push(...info.artigos);
          } catch { /* ignora feed com erro */ }
        })
      );
      // Ordena por data mais recente
      todos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setArtigos(todos);
    } finally {
      setCarregando(false);
    }
  }

  async function adicionarFeed(url: string) {
    const urlLimpa = url.trim();
    if (!urlLimpa) return;
    if (feeds.some((f) => f.url === urlLimpa)) {
      Alert.alert('Feed já adicionado', 'Esse feed já está na sua lista.');
      return;
    }
    setAdicionando(true);
    try {
      const info = await buscarFeedNoticias(urlLimpa);
      await adicionar({
        id: urlLimpa,
        nome: info.nome || urlLimpa,
        url: urlLimpa,
        capa: info.capa || '',
        descricao: info.descricao,
      });
      setNovaUrl('');
      setModalAddFeed(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar esse feed. Verifique a URL.');
    } finally {
      setAdicionando(false);
    }
  }

  function confirmarRemoverFeed(id: string, nome: string) {
    Alert.alert('Remover feed', `Remover "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(id) },
    ]);
  }

  const renderArtigo = ({ item }: { item: ArtigoRSS }) => (
    <TouchableOpacity
      style={[styles.cardArtigo, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}
      onPress={() => setArtigoAberto(item)}
      activeOpacity={0.8}
    >
      {item.imagem ? (
        <Image source={{ uri: item.imagem }} style={styles.imagemArtigo} />
      ) : (
        <View style={[styles.imagemArtigo, { backgroundColor: tema.fundoSecundario, alignItems: 'center', justifyContent: 'center' }]}>
          <Feather name="file-text" size={28} color={tema.textoDesabilitado} />
        </View>
      )}
      <View style={styles.infoArtigo}>
        <Text style={[styles.feedNome, { color: corDestaque }]} numberOfLines={1}>
          {item.feedNome}
        </Text>
        <Text style={[styles.tituloArtigo, { color: tema.texto }]} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.descricao ? (
          <Text style={[styles.descArtigo, { color: tema.textoSecundario }]} numberOfLines={2}>
            {item.descricao}
          </Text>
        ) : null}
        <Text style={[styles.dataArtigo, { color: tema.textoDesabilitado }]}>
          {formatarDataArtigo(item.data)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFeed = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.cardFeed, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}
      onLongPress={() => confirmarRemoverFeed(item.id, item.nome)}
      activeOpacity={0.8}
    >
      {item.capa ? (
        <Image source={{ uri: item.capa }} style={styles.capaFeed} />
      ) : (
        <View style={[styles.capaFeed, { backgroundColor: tema.fundoSecundario, alignItems: 'center', justifyContent: 'center' }]}>
          <Feather name="rss" size={22} color={corDestaque} />
        </View>
      )}
      <View style={styles.infoFeed}>
        <Text style={[styles.nomeFeed, { color: tema.texto }]} numberOfLines={1}>{item.nome}</Text>
        <Text style={[styles.urlFeed, { color: tema.textoDesabilitado }]} numberOfLines={1}>{item.url}</Text>
      </View>
      <TouchableOpacity onPress={() => confirmarRemoverFeed(item.id, item.nome)}>
        <Feather name="trash-2" size={18} color={tema.textoDesabilitado} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      {/* Abas */}
      <View style={[styles.abas, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        {(['artigos', 'feeds'] as const).map((a) => (
          <TouchableOpacity key={a} style={styles.aba} onPress={() => setAba(a)}>
            <Text style={[styles.abaTexto, { color: aba === a ? corDestaque : tema.textoSecundario }]}>
              {a === 'artigos' ? 'Artigos' : 'Meus Feeds'}
            </Text>
            {aba === a && <View style={[styles.abaLinha, { backgroundColor: corDestaque }]} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.botaoAdd} onPress={() => setModalAddFeed(true)}>
          <Ionicons name="add-circle" size={28} color={corDestaque} />
        </TouchableOpacity>
      </View>

      {aba === 'artigos' ? (
        carregando ? (
          <View style={styles.vazio}>
            <ActivityIndicator size="large" color={corDestaque} />
            <Text style={[styles.vazioSub, { color: tema.textoSecundario, marginTop: ESPACOS.md }]}>
              Carregando artigos...
            </Text>
          </View>
        ) : (
          <FlatList
            data={artigos}
            keyExtractor={(item) => item.id}
            renderItem={renderArtigo}
            contentContainerStyle={styles.lista}
            onRefresh={carregarArtigos}
            refreshing={carregando}
            ListEmptyComponent={
              <View style={styles.vazio}>
                <Feather name="rss" size={56} color={tema.textoDesabilitado} />
                <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>Nenhum artigo</Text>
                <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>
                  Adicione feeds RSS na aba "Meus Feeds"
                </Text>
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={feeds}
          keyExtractor={(item) => item.id}
          renderItem={renderFeed}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Feather name="rss" size={56} color={tema.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>Nenhum feed</Text>
              <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>
                Toque no + para adicionar feeds RSS
              </Text>
            </View>
          }
        />
      )}

      {/* Modal adicionar feed */}
      <Modal visible={modalAddFeed} transparent animationType="slide">
        <View style={styles.modalFundo}>
          <View style={[styles.modalBox, { backgroundColor: tema.fundoCard }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]}>Adicionar Feed RSS</Text>

            <TextInput
              value={novaUrl}
              onChangeText={setNovaUrl}
              placeholder="https://exemplo.com/feed.xml"
              placeholderTextColor={tema.textoSecundario}
              style={[styles.modalInput, { color: tema.texto, backgroundColor: tema.fundoSecundario, borderColor: tema.borda }]}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[styles.sugestoesTitulo, { color: tema.textoSecundario }]}>Sugestões:</Text>
            {FEEDS_SUGERIDOS.map((f) => (
              <TouchableOpacity
                key={f.url}
                style={[styles.sugestao, { borderColor: tema.borda }]}
                onPress={() => setNovaUrl(f.url)}
              >
                <Feather name="rss" size={14} color={corDestaque} />
                <Text style={[styles.sugestaoTexto, { color: tema.texto }]}>{f.nome}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBotao, { borderColor: tema.borda }]}
                onPress={() => { setModalAddFeed(false); setNovaUrl(''); }}
              >
                <Text style={[styles.modalBotaoTexto, { color: tema.textoSecundario }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotao, { backgroundColor: corDestaque }]}
                onPress={() => adicionarFeed(novaUrl)}
                disabled={adicionando}
              >
                {adicionando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={[styles.modalBotaoTexto, { color: '#fff' }]}>Adicionar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal leitor de artigo */}
      <Modal visible={!!artigoAberto} transparent animationType="slide">
        <View style={[styles.leitorFundo, { backgroundColor: tema.fundo }]}>
          <View style={[styles.leitorHeader, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
            <TouchableOpacity onPress={() => setArtigoAberto(null)}>
              <Ionicons name="arrow-back" size={24} color={tema.texto} />
            </TouchableOpacity>
            <Text style={[styles.leitorFeedNome, { color: corDestaque }]} numberOfLines={1}>
              {artigoAberto?.feedNome}
            </Text>
            <TouchableOpacity onPress={() => artigoAberto?.link && Linking.openURL(artigoAberto.link)}>
              <Feather name="external-link" size={20} color={tema.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.leitorScroll} contentContainerStyle={styles.leitorConteudo}>
            {artigoAberto?.imagem ? (
              <Image source={{ uri: artigoAberto.imagem }} style={styles.leitorImagem} resizeMode="cover" />
            ) : null}
            <Text style={[styles.leitorData, { color: tema.textoDesabilitado }]}>
              {formatarDataArtigo(artigoAberto?.data || '')}
            </Text>
            <Text style={[styles.leitorTitulo, { color: tema.texto }]}>
              {artigoAberto?.titulo}
            </Text>
            <Text style={[styles.leitorTexto, { color: tema.textoSecundario }]}>
              {artigoAberto?.descricao}
            </Text>
            <TouchableOpacity
              style={[styles.botaoVerCompleto, { borderColor: corDestaque }]}
              onPress={() => artigoAberto?.link && Linking.openURL(artigoAberto.link)}
            >
              <Text style={[styles.botaoVerCompletoTexto, { color: corDestaque }]}>
                Ler artigo completo
              </Text>
              <Feather name="external-link" size={16} color={corDestaque} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  abas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  aba: { flex: 1, alignItems: 'center', paddingVertical: ESPACOS.md },
  abaTexto: { fontSize: FONTES.normal, fontWeight: '600' },
  abaLinha: { height: 2, width: '60%', borderRadius: 2, marginTop: 4 },
  botaoAdd: { paddingHorizontal: ESPACOS.lg },
  lista: { padding: ESPACOS.md },

  cardArtigo: {
    borderRadius: RAIOS.md,
    borderWidth: 1,
    marginBottom: ESPACOS.md,
    overflow: 'hidden',
  },
  imagemArtigo: { width: '100%', height: 160 },
  infoArtigo: { padding: ESPACOS.md, gap: 4 },
  feedNome: { fontSize: FONTES.pequena, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tituloArtigo: { fontSize: FONTES.media, fontWeight: '700', lineHeight: 22 },
  descArtigo: { fontSize: FONTES.normal, lineHeight: 18 },
  dataArtigo: { fontSize: FONTES.pequena, marginTop: 2 },

  cardFeed: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    borderWidth: 1,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },
  capaFeed: { width: 44, height: 44, borderRadius: RAIOS.sm },
  infoFeed: { flex: 1 },
  nomeFeed: { fontSize: FONTES.normal, fontWeight: '600' },
  urlFeed: { fontSize: FONTES.pequena, marginTop: 2 },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACOS.xl, gap: ESPACOS.md, marginTop: 60 },
  vazioTitulo: { fontSize: FONTES.grande, fontWeight: '600' },
  vazioSub: { fontSize: FONTES.normal, textAlign: 'center' },

  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RAIOS.xl, borderTopRightRadius: RAIOS.xl, padding: ESPACOS.xl },
  modalTitulo: { fontSize: FONTES.grande, fontWeight: 'bold', marginBottom: ESPACOS.lg },
  modalInput: {
    borderRadius: RAIOS.md, borderWidth: 1,
    padding: ESPACOS.md, fontSize: FONTES.normal, marginBottom: ESPACOS.md,
  },
  sugestoesTitulo: { fontSize: FONTES.pequena, fontWeight: '600', marginBottom: ESPACOS.sm, textTransform: 'uppercase' },
  sugestao: {
    flexDirection: 'row', alignItems: 'center', gap: ESPACOS.sm,
    paddingVertical: ESPACOS.sm, borderBottomWidth: 1,
  },
  sugestaoTexto: { fontSize: FONTES.normal },
  modalBotoes: { flexDirection: 'row', gap: ESPACOS.md, marginTop: ESPACOS.lg },
  modalBotao: {
    flex: 1, padding: ESPACOS.md, borderRadius: RAIOS.md,
    alignItems: 'center', borderWidth: 1,
  },
  modalBotaoTexto: { fontSize: FONTES.normal, fontWeight: '600' },

  leitorFundo: { flex: 1 },
  leitorHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingHorizontal: ESPACOS.lg, paddingBottom: ESPACOS.md,
    borderBottomWidth: 1, gap: ESPACOS.md,
  },
  leitorFeedNome: { flex: 1, fontSize: FONTES.normal, fontWeight: '600' },
  leitorScroll: { flex: 1 },
  leitorConteudo: { padding: ESPACOS.lg, gap: ESPACOS.md },
  leitorImagem: { width: '100%', height: 200, borderRadius: RAIOS.md },
  leitorData: { fontSize: FONTES.pequena },
  leitorTitulo: { fontSize: FONTES.titulo, fontWeight: 'bold', lineHeight: 28 },
  leitorTexto: { fontSize: FONTES.media, lineHeight: 24 },
  botaoVerCompleto: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: ESPACOS.sm, borderWidth: 1.5, borderRadius: RAIOS.md,
    padding: ESPACOS.md, marginTop: ESPACOS.md,
  },
  botaoVerCompletoTexto: { fontSize: FONTES.normal, fontWeight: '600' },
});
