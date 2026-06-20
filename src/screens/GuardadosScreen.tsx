import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore, usePlayerStore, Episodio } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { tocarEpisodio } from '../services/player';
import { formatarData } from '../services/rss';

const CHAVE = 'episodiosGuardados';

export default function GuardadosScreen() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const playerEstado = usePlayerStore((s) => s.estado);

  const [guardados, setGuardados] = useState<Episodio[]>([]);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const raw = await AsyncStorage.getItem(CHAVE);
    setGuardados(raw ? JSON.parse(raw) : []);
  }

  async function remover(id: string) {
    const nova = guardados.filter((e) => e.id !== id);
    setGuardados(nova);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(nova));
  }

  function confirmarRemover(ep: Episodio) {
    Alert.alert('Remover', `Remover "${ep.titulo}" dos guardados?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(ep.id) },
    ]);
  }

  async function tocar(ep: Episodio) {
    await tocarEpisodio({
      id: ep.id,
      titulo: ep.titulo,
      url: ep.url,
      capa: ep.capa,
      podcastNome: ep.podcastNome,
    });
  }

  const renderItem = ({ item }: { item: Episodio }) => {
    const tocando = playerEstado?.url === item.url;
    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: tema.fundoCard,
          borderColor: tocando ? corDestaque : tema.borda,
          borderWidth: tocando ? 1.5 : 1,
        }]}
        onPress={() => tocar(item)}
        onLongPress={() => confirmarRemover(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.capa }} style={styles.capa} />
        <View style={styles.info}>
          <Text style={[styles.podcast, { color: corDestaque }]} numberOfLines={1}>
            {item.podcastNome}
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
        <View style={styles.acoes}>
          <Ionicons
            name={tocando && playerEstado?.tocando ? 'pause-circle' : 'play-circle-outline'}
            size={30}
            color={tocando ? corDestaque : tema.textoSecundario}
          />
          <TouchableOpacity onPress={() => confirmarRemover(item)}>
            <Feather name="bookmark" size={20} color={corDestaque} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <Text style={[styles.headerTitulo, { color: corDestaque }]}>Guardados</Text>
        <Text style={[styles.contador, { color: tema.textoSecundario }]}>
          {guardados.length} {guardados.length === 1 ? 'episódio' : 'episódios'}
        </Text>
      </View>

      <FlatList
        data={guardados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={guardados.length === 0 ? styles.listaVazia : styles.lista}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Feather name="bookmark" size={56} color={tema.textoDesabilitado} />
            <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>
              Nenhum episódio guardado
            </Text>
            <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>
              Guarde episódios para ouvir depois
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 48,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.md,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: FONTES.titulo, fontWeight: 'bold' },
  contador: { fontSize: FONTES.pequena, marginTop: 2 },
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
  capa: { width: 56, height: 56, borderRadius: RAIOS.sm },
  info: { flex: 1 },
  podcast: { fontSize: FONTES.pequena, fontWeight: '700' },
  titulo: { fontSize: FONTES.normal, fontWeight: '600', lineHeight: 18, marginTop: 2 },
  data: { fontSize: FONTES.pequena, marginTop: 2 },
  acoes: { alignItems: 'center', gap: ESPACOS.sm },
  vazio: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: ESPACOS.md, padding: ESPACOS.xl,
  },
  vazioTitulo: { fontSize: FONTES.grande, fontWeight: '600' },
  vazioSub: { fontSize: FONTES.normal, textAlign: 'center' },
});
