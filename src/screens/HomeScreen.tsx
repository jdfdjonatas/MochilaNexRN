import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore, usePodcastStore, useDownloadStore } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { buscarFeed, EpisodioRSS, formatarData } from '../services/rss';
import { tocarEpisodio } from '../services/player';
import { usePlayerStore } from '../store';

export default function HomeScreen({ navigation }: any) {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { podcasts, carregar } = usePodcastStore();
  const { downloads } = useDownloadStore();
  const playerEstado = usePlayerStore((s) => s.estado);

  const [recentes, setRecentes] = useState<EpisodioRSS[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (podcasts.length > 0) carregarRecentes();
  }, [podcasts]);

  async function carregarRecentes() {
    setCarregando(true);
    try {
      const todos: EpisodioRSS[] = [];
      await Promise.allSettled(
        podcasts.slice(0, 6).map(async (p) => {
          try {
            const feed = await buscarFeed(p.url);
            todos.push(...feed.episodios.slice(0, 3));
          } catch {}
        })
      );
      todos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setRecentes(todos.slice(0, 20));
    } finally {
      setCarregando(false);
    }
  }

  async function tocar(ep: EpisodioRSS) {
    await tocarEpisodio({
      id: ep.id,
      titulo: ep.titulo,
      url: ep.url,
      capa: ep.capa,
      podcastNome: ep.podcastNome,
    });
  }

  const tocandoAgora = playerEstado;

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <Text style={[styles.titulo, { color: corDestaque }]}>MochilaNex</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Configuracoes')}>
          <Ionicons name="settings-outline" size={24} color={tema.texto} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Tocando agora */}
        {tocandoAgora && (
          <View style={[styles.tocandoCard, { backgroundColor: corDestaque + '20', borderColor: corDestaque }]}>
            <Image source={{ uri: tocandoAgora.capa }} style={styles.tocandoCapa} />
            <View style={styles.tocandoInfo}>
              <Text style={[styles.tocandoLabel, { color: corDestaque }]}>▶ Tocando agora</Text>
              <Text style={[styles.tocandoTitulo, { color: tema.texto }]} numberOfLines={1}>
                {tocandoAgora.titulo}
              </Text>
              <Text style={[styles.tocandoSub, { color: tema.textoSecundario }]} numberOfLines={1}>
                {tocandoAgora.subtitulo}
              </Text>
            </View>
          </View>
        )}

        {/* Estatísticas rápidas */}
        <View style={styles.stats}>
          {[
            { label: 'Podcasts', valor: podcasts.length, icone: 'mic' },
            { label: 'Baixados', valor: downloads.filter(d => d.offline).length, icone: 'download' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}>
              <Ionicons name={s.icone as any} size={20} color={corDestaque} />
              <Text style={[styles.statValor, { color: tema.texto }]}>{s.valor}</Text>
              <Text style={[styles.statLabel, { color: tema.textoSecundario }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Podcasts que sigo */}
        {podcasts.length > 0 && (
          <View style={styles.secao}>
            <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Podcasts que sigo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalLista}>
              {podcasts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.podcastMini}
                  onPress={() => navigation.navigate('Assinaturas')}
                >
                  <Image source={{ uri: p.capa }} style={styles.podcastMiniCapa} />
                  <Text style={[styles.podcastMiniNome, { color: tema.textoSecundario }]} numberOfLines={2}>
                    {p.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Episódios recentes */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Episódios recentes</Text>
            {carregando && <ActivityIndicator size="small" color={corDestaque} />}
          </View>

          {podcasts.length === 0 ? (
            <View style={styles.vazio}>
              <Ionicons name="mic-outline" size={48} color={tema.textoDesabilitado} />
              <Text style={[styles.vazioTexto, { color: tema.textoSecundario }]}>
                Assine podcasts para ver episódios aqui
              </Text>
              <TouchableOpacity
                style={[styles.botaoAssinar, { borderColor: corDestaque }]}
                onPress={() => navigation.navigate('Assinaturas')}
              >
                <Text style={[styles.botaoAssinarTexto, { color: corDestaque }]}>Buscar podcasts</Text>
              </TouchableOpacity>
            </View>
          ) : recentes.length === 0 && !carregando ? (
            <Text style={[styles.vazioTexto, { color: tema.textoSecundario }]}>
              Nenhum episódio encontrado.
            </Text>
          ) : (
            recentes.map((ep) => {
              const tocando = playerEstado?.url === ep.url;
              return (
                <TouchableOpacity
                  key={ep.id}
                  style={[styles.epCard, { backgroundColor: tema.fundoCard, borderColor: tocando ? corDestaque : tema.borda, borderWidth: tocando ? 1.5 : 1 }]}
                  onPress={() => tocar(ep)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: ep.capa }} style={styles.epCapa} />
                  <View style={styles.epInfo}>
                    <Text style={[styles.epPodcast, { color: corDestaque }]} numberOfLines={1}>{ep.podcastNome}</Text>
                    <Text style={[styles.epTitulo, { color: tema.texto }]} numberOfLines={2}>{ep.titulo}</Text>
                    <Text style={[styles.epData, { color: tema.textoDesabilitado }]}>{formatarData(ep.data)}</Text>
                  </View>
                  <Ionicons
                    name={tocando && playerEstado?.tocando ? 'pause-circle' : 'play-circle-outline'}
                    size={32}
                    color={tocando ? corDestaque : tema.textoSecundario}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.md,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: FONTES.titulo, fontWeight: 'bold' },

  tocandoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: ESPACOS.md,
    padding: ESPACOS.md,
    borderRadius: RAIOS.md,
    borderWidth: 1,
    gap: ESPACOS.md,
  },
  tocandoCapa: { width: 52, height: 52, borderRadius: RAIOS.sm },
  tocandoInfo: { flex: 1 },
  tocandoLabel: { fontSize: FONTES.pequena, fontWeight: '700' },
  tocandoTitulo: { fontSize: FONTES.normal, fontWeight: '600', marginTop: 2 },
  tocandoSub: { fontSize: FONTES.pequena, marginTop: 1 },

  stats: {
    flexDirection: 'row',
    padding: ESPACOS.md,
    gap: ESPACOS.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: ESPACOS.md,
    borderRadius: RAIOS.md,
    borderWidth: 1,
    gap: 4,
  },
  statValor: { fontSize: FONTES.titulo, fontWeight: 'bold' },
  statLabel: { fontSize: FONTES.pequena },

  secao: { padding: ESPACOS.md },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACOS.md },
  secaoTitulo: { fontSize: FONTES.grande, fontWeight: 'bold', marginBottom: ESPACOS.md },
  horizontalLista: { gap: ESPACOS.md, paddingBottom: ESPACOS.sm },

  podcastMini: { width: 80, alignItems: 'center', gap: 6 },
  podcastMiniCapa: { width: 64, height: 64, borderRadius: RAIOS.md },
  podcastMiniNome: { fontSize: FONTES.pequena, textAlign: 'center', lineHeight: 14 },

  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },
  epCapa: { width: 52, height: 52, borderRadius: RAIOS.sm },
  epInfo: { flex: 1 },
  epPodcast: { fontSize: FONTES.pequena, fontWeight: '700' },
  epTitulo: { fontSize: FONTES.normal, fontWeight: '600', marginTop: 2, lineHeight: 18 },
  epData: { fontSize: FONTES.pequena, marginTop: 2 },

  vazio: { alignItems: 'center', paddingVertical: ESPACOS.xl, gap: ESPACOS.md },
  vazioTexto: { fontSize: FONTES.normal, textAlign: 'center' },
  botaoAssinar: {
    borderWidth: 1.5, borderRadius: RAIOS.md,
    paddingHorizontal: ESPACOS.lg, paddingVertical: ESPACOS.sm,
    marginTop: ESPACOS.sm,
  },
  botaoAssinarTexto: { fontSize: FONTES.normal, fontWeight: '600' },
});
