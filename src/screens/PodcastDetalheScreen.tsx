import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore, useDownloadStore, Podcast } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { buscarFeed, formatarData, formatarDuracao, EpisodioRSS } from '../services/rss';
import { tocarEpisodio } from '../services/player';
import { baixarEpisodio } from '../services/download';

export default function PodcastDetalheScreen({ route, navigation }: any) {
  const podcast: Podcast = route.params.podcast;
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { downloads } = useDownloadStore();

  const [episodios, setEpisodios] = useState<EpisodioRSS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarEpisodios();
  }, []);

  async function carregarEpisodios() {
    setCarregando(true);
    setErro('');
    try {
      const info = await buscarFeed(podcast.url);
      setEpisodios(info.episodios);
    } catch (e) {
      setErro('Não foi possível carregar os episódios. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  }

  function jaBaixado(id: string) {
    return downloads.some((d) => d.id === id && d.offline);
  }

  function progressoDownload(id: string) {
    const d = downloads.find((d) => d.id === id);
    return d?.progresso ?? null;
  }

  function renderEpisodio({ item }: { item: EpisodioRSS }) {
    const baixado = jaBaixado(item.id);
    const progresso = progressoDownload(item.id);

    return (
      <View style={[styles.cardEpisodio, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}>
        <TouchableOpacity
          style={styles.infoEpisodio}
          onPress={() =>
            tocarEpisodio({
              id: item.id,
              titulo: item.titulo,
              url: item.url,
              capa: item.capa,
              podcastNome: item.podcastNome,
            })
          }
        >
          <Text style={[styles.tituloEpisodio, { color: tema.texto }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={[styles.metaEpisodio, { color: tema.textoSecundario }]}>
            {formatarData(item.data)}
            {item.duracao ? ` · ${formatarDuracao(item.duracao)}` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.acoesEpisodio}>
          <TouchableOpacity
            style={styles.botaoIcone}
            onPress={() =>
              tocarEpisodio({
                id: item.id,
                titulo: item.titulo,
                url: item.url,
                capa: item.capa,
                podcastNome: item.podcastNome,
              })
            }
          >
            <Ionicons name="play-circle" size={30} color={corDestaque} />
          </TouchableOpacity>

          {baixado ? (
            <Ionicons name="checkmark-circle" size={22} color={corDestaque} style={styles.iconeStatus} />
          ) : progresso !== null && progresso < 100 ? (
            <Text style={[styles.progressoTexto, { color: tema.textoSecundario }]}>{progresso}%</Text>
          ) : (
            <TouchableOpacity
              style={styles.botaoIcone}
              onPress={() =>
                baixarEpisodio(
                  item.id,
                  item.url,
                  item.titulo,
                  item.capa,
                  item.podcastNome,
                  item.podcastUrl
                ).catch(() => setErro('Falha ao iniciar o download.'))
              }
            >
              <Ionicons name="download-outline" size={22} color={tema.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="chevron-back" size={26} color={corDestaque} />
        </TouchableOpacity>
        <Image source={{ uri: podcast.capa }} style={styles.capaHeader} />
        <Text style={[styles.tituloHeader, { color: tema.texto }]} numberOfLines={1}>
          {podcast.nome}
        </Text>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={corDestaque} />
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Text style={[styles.textoErro, { color: tema.textoSecundario }]}>{erro}</Text>
          <TouchableOpacity onPress={carregarEpisodios} style={[styles.botaoTentar, { borderColor: corDestaque }]}>
            <Text style={{ color: corDestaque }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={episodios}
          keyExtractor={(item) => item.id}
          renderItem={renderEpisodio}
          contentContainerStyle={{ padding: ESPACOS.lg, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={[styles.textoErro, { color: tema.textoSecundario }]}>
              Nenhum episódio encontrado neste feed.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: ESPACOS.sm,
    paddingBottom: ESPACOS.md,
    borderBottomWidth: 1,
  },
  botaoVoltar: { padding: ESPACOS.xs },
  capaHeader: { width: 32, height: 32, borderRadius: RAIOS.sm, marginHorizontal: ESPACOS.sm },
  tituloHeader: { fontSize: FONTES.media, fontWeight: 'bold', flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACOS.xl },
  textoErro: { fontSize: FONTES.normal, textAlign: 'center', marginBottom: ESPACOS.md },
  botaoTentar: { borderWidth: 1, borderRadius: RAIOS.md, paddingVertical: ESPACOS.sm, paddingHorizontal: ESPACOS.lg },
  cardEpisodio: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RAIOS.md,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    alignItems: 'center',
  },
  infoEpisodio: { flex: 1, marginRight: ESPACOS.sm },
  tituloEpisodio: { fontSize: FONTES.media, fontWeight: '600', marginBottom: ESPACOS.xs },
  metaEpisodio: { fontSize: FONTES.pequena },
  acoesEpisodio: { alignItems: 'center', flexDirection: 'row', gap: ESPACOS.sm },
  botaoIcone: { padding: ESPACOS.xs },
  iconeStatus: { marginLeft: ESPACOS.xs },
  progressoTexto: { fontSize: FONTES.pequena, width: 36, textAlign: 'center' },
});
