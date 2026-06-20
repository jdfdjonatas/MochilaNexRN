import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useConfigStore, useRadioStore } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { buscarRadios, radiosPopulares, Radio } from '../services/radio';
import { tocarEpisodio } from '../services/player';
import { usePlayerStore } from '../store';

export default function RadioScreen() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { radios, adicionar, remover, carregar } = useRadioStore();
  const playerEstado = usePlayerStore((s) => s.estado);

  const [aba, setAba] = useState<'minhas' | 'buscar'>('minhas');
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<Radio[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [carregandoPopulares, setCarregandoPopulares] = useState(false);
  const [populares, setPopulares] = useState<Radio[]>([]);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (aba === 'buscar' && populares.length === 0) {
      carregarPopulares();
    }
  }, [aba]);

  async function carregarPopulares() {
    setCarregandoPopulares(true);
    try {
      const lista = await radiosPopulares('BR');
      setPopulares(lista);
    } catch {
      try {
        const lista = await radiosPopulares('US');
        setPopulares(lista);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar rádios populares.');
      }
    } finally {
      setCarregandoPopulares(false);
    }
  }

  async function buscar() {
    if (!termo.trim()) return;
    setBuscando(true);
    setResultados([]);
    try {
      const lista = await buscarRadios(termo.trim());
      setResultados(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar. Verifique sua conexão.');
    } finally {
      setBuscando(false);
    }
  }

  async function tocarRadio(radio: Radio) {
    await tocarEpisodio({
      id: radio.stationuuid,
      titulo: radio.name,
      url: radio.url_resolved,
      capa: radio.favicon || '',
      podcastNome: radio.country || 'Rádio',
    });
  }

  function jaSalva(uuid: string) {
    return radios.some((r) => r.id === uuid);
  }

  async function salvarRadio(radio: Radio) {
    await adicionar({
      id: radio.stationuuid,
      nome: radio.name,
      url: radio.url_resolved,
      capa: radio.favicon || '',
    });
  }

  function confirmarRemover(id: string, nome: string) {
    Alert.alert('Remover rádio', `Remover "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(id) },
    ]);
  }

  const listaBusca = resultados.length > 0 ? resultados : populares;

  const renderRadio = ({ item }: { item: Radio }) => {
    const tocando = playerEstado?.url === item.url_resolved;
    const salva = jaSalva(item.stationuuid);

    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: tema.fundoCard,
          borderColor: tocando ? corDestaque : tema.borda,
          borderWidth: tocando ? 1.5 : 1,
        }]}
        onPress={() => tocarRadio(item)}
        activeOpacity={0.8}
      >
        {item.favicon ? (
          <Image source={{ uri: item.favicon }} style={styles.capa} />
        ) : (
          <View style={[styles.capa, { backgroundColor: tema.fundoSecundario, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="radio" size={24} color={corDestaque} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.nome, { color: tocando ? corDestaque : tema.texto }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.sub, { color: tema.textoSecundario }]} numberOfLines={1}>
            {[item.country, item.language, item.bitrate ? `${item.bitrate}kbps` : ''].filter(Boolean).join(' · ')}
          </Text>
          {item.tags ? (
            <Text style={[styles.tags, { color: tema.textoDesabilitado }]} numberOfLines={1}>
              {item.tags.split(',').slice(0, 3).join(', ')}
            </Text>
          ) : null}
        </View>
        <View style={styles.acoes}>
          {tocando && playerEstado?.tocando ? (
            <MaterialIcons name="graphic-eq" size={24} color={corDestaque} />
          ) : (
            <Ionicons name="play-circle-outline" size={28} color={tema.textoSecundario} />
          )}
          <TouchableOpacity
            onPress={() => salva
              ? confirmarRemover(item.stationuuid, item.name)
              : salvarRadio(item)
            }
            style={styles.botaoSalvar}
          >
            <Ionicons
              name={salva ? 'heart' : 'heart-outline'}
              size={22}
              color={salva ? corDestaque : tema.textoSecundario}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMinhas = ({ item }: { item: any }) => {
    const tocando = playerEstado?.url === item.url;
    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: tema.fundoCard,
          borderColor: tocando ? corDestaque : tema.borda,
          borderWidth: tocando ? 1.5 : 1,
        }]}
        onPress={() => tocarEpisodio({ id: item.id, titulo: item.nome, url: item.url, capa: item.capa, podcastNome: 'Rádio' })}
        onLongPress={() => confirmarRemover(item.id, item.nome)}
        activeOpacity={0.8}
      >
        {item.capa ? (
          <Image source={{ uri: item.capa }} style={styles.capa} />
        ) : (
          <View style={[styles.capa, { backgroundColor: tema.fundoSecundario, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="radio" size={24} color={corDestaque} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.nome, { color: tocando ? corDestaque : tema.texto }]} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={[styles.sub, { color: tema.textoSecundario }]}>Rádio salva</Text>
        </View>
        <View style={styles.acoes}>
          {tocando && playerEstado?.tocando
            ? <MaterialIcons name="graphic-eq" size={24} color={corDestaque} />
            : <Ionicons name="play-circle-outline" size={28} color={tema.textoSecundario} />
          }
          <Ionicons name="heart" size={22} color={corDestaque} style={styles.botaoSalvar} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      {/* Abas */}
      <View style={[styles.abas, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        {(['minhas', 'buscar'] as const).map((a) => (
          <TouchableOpacity key={a} style={styles.aba} onPress={() => setAba(a)}>
            <Text style={[styles.abaTexto, { color: aba === a ? corDestaque : tema.textoSecundario }]}>
              {a === 'minhas' ? 'Minhas Rádios' : 'Descobrir'}
            </Text>
            {aba === a && <View style={[styles.abaLinha, { backgroundColor: corDestaque }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {aba === 'buscar' && (
        <View style={[styles.barraBusca, { borderBottomColor: tema.borda }]}>
          <TextInput
            value={termo}
            onChangeText={setTermo}
            onSubmitEditing={buscar}
            placeholder="Buscar rádio..."
            placeholderTextColor={tema.textoSecundario}
            style={[styles.input, { color: tema.texto, backgroundColor: tema.fundoSecundario }]}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={buscar} style={styles.botaoBuscar}>
            {buscando ? (
              <ActivityIndicator color={corDestaque} />
            ) : (
              <Ionicons name="search" size={22} color={corDestaque} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {aba === 'minhas' ? (
        <FlatList
          data={radios}
          keyExtractor={(item) => item.id}
          renderItem={renderMinhas}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="radio-outline" size={56} color={tema.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>Nenhuma rádio salva</Text>
              <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>Vá em Descobrir para encontrar rádios</Text>
            </View>
          }
        />
      ) : (
        carregandoPopulares && resultados.length === 0 ? (
          <View style={styles.vazio}>
            <ActivityIndicator size="large" color={corDestaque} />
            <Text style={[styles.vazioSub, { color: tema.textoSecundario, marginTop: ESPACOS.md }]}>
              Carregando rádios populares...
            </Text>
          </View>
        ) : (
          <FlatList
            data={listaBusca}
            keyExtractor={(item) => item.stationuuid}
            renderItem={renderRadio}
            contentContainerStyle={styles.lista}
            ListHeaderComponent={
              resultados.length === 0 && populares.length > 0 ? (
                <Text style={[styles.secaoTitulo, { color: tema.textoSecundario }]}>🇧🇷 Populares no Brasil</Text>
              ) : resultados.length > 0 ? (
                <Text style={[styles.secaoTitulo, { color: tema.textoSecundario }]}>{resultados.length} resultados</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.vazio}>
                <Feather name="wifi-off" size={48} color={tema.textoDesabilitado} />
                <Text style={[styles.vazioSub, { color: tema.textoSecundario }]}>Nenhuma rádio encontrada</Text>
              </View>
            }
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  abas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ESPACOS.md,
  },
  abaTexto: { fontSize: FONTES.normal, fontWeight: '600' },
  abaLinha: { height: 2, width: '60%', borderRadius: 2, marginTop: 4 },
  barraBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.sm,
    borderBottomWidth: 1,
    gap: ESPACOS.sm,
  },
  input: {
    flex: 1,
    borderRadius: RAIOS.md,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    fontSize: FONTES.normal,
  },
  botaoBuscar: { padding: ESPACOS.xs },
  lista: { padding: ESPACOS.md, gap: ESPACOS.sm },
  secaoTitulo: {
    fontSize: FONTES.pequena,
    fontWeight: '600',
    marginBottom: ESPACOS.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },
  capa: { width: 52, height: 52, borderRadius: RAIOS.sm },
  info: { flex: 1 },
  nome: { fontSize: FONTES.normal, fontWeight: '600' },
  sub: { fontSize: FONTES.pequena, marginTop: 2 },
  tags: { fontSize: FONTES.pequena, marginTop: 2 },
  acoes: { alignItems: 'center', gap: ESPACOS.sm },
  botaoSalvar: { padding: 2 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACOS.xl, gap: ESPACOS.md, marginTop: 60 },
  vazioTitulo: { fontSize: FONTES.grande, fontWeight: '600' },
  vazioSub: { fontSize: FONTES.normal, textAlign: 'center' },
});
