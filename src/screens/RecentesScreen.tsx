import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore, usePlayerStore, Episodio } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { tocarEpisodio } from '../services/player';
import { formatarData } from '../services/rss';

const CHAVE = 'historicoReproducao';
const MAX_HISTORICO = 50;

export async function adicionarAoHistorico(ep: Episodio) {
  const raw = await AsyncStorage.getItem(CHAVE);
  const lista: Episodio[] = raw ? JSON.parse(raw) : [];
  const filtrada = lista.filter((e) => e.id !== ep.id);
  const nova = [ep, ...filtrada].slice(0, MAX_HISTORICO);
  await AsyncStorage.setItem(CHAVE, JSON.stringify(nova));
}

export default function RecentesScreen() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const playerEstado = usePlayerStore((s) => s.estado);

  const [historico, setHistorico] = useState<Episodio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const raw = await AsyncStorage.getItem(CHAVE);
    setHistorico(raw ? JSON.parse(raw) : []);
    setCarregando(false);
  }

  async function limpar() {
    await AsyncStorage.removeItem(CHAVE);
    setHistorico([]);
  }

  const tocar = useCallback(async (ep: Episodio) => {
    await tocarEpisodio({
      id: ep.id,
      titulo: ep.titulo,
      url: ep.url,
      capa: ep.capa,
      podcastNome: ep.podcastNome,
    });
  }, []);

  const renderItem = ({ item, index }: { item: Episodio; index: number }) => {
    const tocando = playerEstado?.url === item.url;
    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: tema.fundoCard,
          borderColor: tocando ? corDestaque : tema.borda,
          borderWidth: tocando ? 1.5 : 1,
        }]}
        onPress={() => tocar(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.numero, { color: tema.textoDesabilitado }]}>
          {index + 1}
        </Text>
        <Image source={{ uri: item.capa }} style={styles.capa} />
        <View style={styles.info}>
          <Text style={[styles.podcast, { color: corDestaque }]} numberOfLines={1}>
            {item.podcastNome || 'Podcast'}
          </Text>
          <Text style={[styles.titulo, { color: tema.texto }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {item.data && (
            <Text style={[styles.data, { color: tema.textoDesabilitado }]}>
              {formatarData(item.data)}
            </Text>
          )}
        </View>
        <Ionicons
          name={tocando && playerEstado?.tocando ? 'pause-circle' : 'play-circle-outline'}
          size={30}
          color={tocando ? corDestaque : tema.textoSecundario}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <Text style={[styles.headerTitulo, { color: corDestaque }]}>Recentes</Text>
        {historico.length > 0 && (
          <TouchableOpacity onPress={limpar}>
            <Feather name="trash-2" size={20} color={tema.textoSecundario} />
          </TouchableOpacity>
        )}
      </View>

      {carregando ? (
        <View style={styles.vazio}>
          <ActivityIndicator size="large" color={corDestaque} />
        </View>
      ) : (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={historico.length === 0 ? styles.listaVazia : styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="time-outline" size={56} color={tema.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>
                Nenhum episódio recente
              </Text>
              <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>
                Os episódios que você ouvir aparecerão aqui
              </Text>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.md,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: FONTES.titulo, fontWeight: 'bold' },
  lista: { padding: ESPACOS.md },
  listaVazia: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },
  numero: { fontSize: FONTES.pequena, minWidth: 18, textAlign: 'center' },
  capa: { width: 52, height: 52, borderRadius: RAIOS.sm },
  info: { flex: 1 },
  podcast: { fontSize: FONTES.pequena, fontWeight: '700' },
  titulo: { fontSize: FONTES.normal, fontWeight: '600', lineHeight: 18, marginTop: 2 },
  data: { fontSize: FONTES.pequena, marginTop: 2 },
  vazio: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: ESPACOS.md, padding: ESPACOS.xl,
  },
  vazioTitulo: { fontSize: FONTES.grande, fontWeight: '600' },
  vazioSub: { fontSize: FONTES.normal, textAlign: 'center' },
});