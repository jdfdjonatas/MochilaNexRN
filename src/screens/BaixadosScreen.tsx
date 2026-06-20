import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { useDownloadStore, useConfigStore, usePlayerStore, Download } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { tocarEpisodio } from '../services/player';
import { removerArquivo, calcularEspacoUsado } from '../services/download';

export default function BaixadosScreen() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { downloads, carregar, remover } = useDownloadStore();
  const playerEstado = usePlayerStore((s) => s.estado);

  const [espacoUsado, setEspacoUsado] = useState('0 MB');
  const [carregando, setCarregando] = useState(true);

  // Carrega downloads e espaço ao abrir a tela
  useEffect(() => {
    async function init() {
      await carregar();
      const espaco = await calcularEspacoUsado();
      setEspacoUsado(espaco);
      setCarregando(false);
    }
    init();
  }, []);

  // Atualiza espaço sempre que a lista muda
  useEffect(() => {
    calcularEspacoUsado().then(setEspacoUsado);
  }, [downloads]);

  const tocarItem = useCallback(async (item: Download) => {
    await tocarEpisodio({
      id: item.id,
      titulo: item.titulo,
      url: item.caminhoLocal || item.urlOriginal,
      capa: item.capa,
      podcastNome: item.podcastNome,
    });
  }, []);

  const confirmarRemocao = useCallback((item: Download) => {
    Alert.alert(
      'Remover download',
      `Deseja remover "${item.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (item.caminhoLocal) await removerArquivo(item.caminhoLocal);
            await remover(item.id);
          },
        },
      ]
    );
  }, []);

  const formatarTempo = (seg: number) => {
    if (!seg) return '';
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = Math.floor(seg % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: Download }) => {
    const tocandoAgora = playerEstado?.url === (item.caminhoLocal || item.urlOriginal);
    const baixando = !item.offline && (item.progresso ?? 0) < 100;
    const progresso = item.progresso ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: tema.fundoCard,
            borderColor: tocandoAgora ? corDestaque : tema.borda,
            borderWidth: tocandoAgora ? 1.5 : 1,
          },
        ]}
        onPress={() => item.offline && tocarItem(item)}
        onLongPress={() => confirmarRemocao(item)}
        activeOpacity={0.8}
      >
        {/* Capa */}
        <Image
          source={{ uri: item.capa || 'https://via.placeholder.com/56' }}
          style={styles.capa}
        />

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.titulo, { color: tocandoAgora ? corDestaque : tema.texto }]}
            numberOfLines={2}
          >
            {item.titulo}
          </Text>
          <Text style={[styles.subtitulo, { color: tema.textoSecundario }]} numberOfLines={1}>
            {item.podcastNome || 'Podcast'}
          </Text>
          <Text style={[styles.data, { color: tema.textoDesabilitado }]}>{item.data}</Text>

          {/* Barra de progresso durante download */}
          {baixando && (
            <View style={styles.progressoContainer}>
              <View style={[styles.progressoFundo, { backgroundColor: tema.borda }]}>
                <View
                  style={[
                    styles.progressoBarra,
                    { width: `${progresso}%`, backgroundColor: corDestaque },
                  ]}
                />
              </View>
              <Text style={[styles.progressoTexto, { color: corDestaque }]}>
                {progresso}%
              </Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.acoes}>
          {baixando ? (
            <ActivityIndicator size="small" color={corDestaque} />
          ) : item.offline ? (
            <TouchableOpacity onPress={() => tocarItem(item)} style={styles.botaoPlay}>
              <AntDesign
                name={tocandoAgora && playerEstado?.tocando ? 'pausecircle' : 'playcircleo'}
                size={32}
                color={corDestaque}
              />
            </TouchableOpacity>
          ) : (
            <MaterialIcons name="error-outline" size={28} color={tema.textoDesabilitado} />
          )}

          <TouchableOpacity
            onPress={() => confirmarRemocao(item)}
            style={styles.botaoLixo}
          >
            <Feather name="trash-2" size={20} color={tema.textoSecundario} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVazio = () => (
    <View style={styles.vazio}>
      <Feather name="download" size={56} color={tema.textoDesabilitado} />
      <Text style={[styles.vazioTitulo, { color: tema.textoSecundario }]}>
        Nenhum episódio baixado
      </Text>
      <Text style={[styles.vazioSub, { color: tema.textoDesabilitado }]}>
        Baixe episódios para ouvir sem internet
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <Text style={[styles.headerTitulo, { color: corDestaque }]}>Baixados</Text>
        <View style={styles.headerInfo}>
          <Feather name="hard-drive" size={14} color={tema.textoSecundario} />
          <Text style={[styles.espacoTexto, { color: tema.textoSecundario }]}>
            {espacoUsado} usados
          </Text>
          <Text style={[styles.contador, { color: tema.textoDesabilitado }]}>
            · {downloads.length} {downloads.length === 1 ? 'episódio' : 'episódios'}
          </Text>
        </View>
      </View>

      {/* Lista */}
      {carregando ? (
        <View style={styles.vazio}>
          <ActivityIndicator size="large" color={corDestaque} />
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderVazio}
          contentContainerStyle={downloads.length === 0 ? styles.listaVazia : styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTitulo: {
    fontSize: FONTES.titulo,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  espacoTexto: {
    fontSize: FONTES.pequena,
    marginLeft: 4,
  },
  contador: {
    fontSize: FONTES.pequena,
  },

  lista: {
    padding: ESPACOS.md,
    gap: ESPACOS.sm,
  },
  listaVazia: {
    flex: 1,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },

  capa: {
    width: 56,
    height: 56,
    borderRadius: RAIOS.sm,
    backgroundColor: '#333',
  },

  info: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: FONTES.normal,
    fontWeight: '600',
    lineHeight: 18,
  },
  subtitulo: {
    fontSize: FONTES.pequena,
  },
  data: {
    fontSize: FONTES.pequena,
    marginTop: 2,
  },

  progressoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
    marginTop: ESPACOS.xs,
  },
  progressoFundo: {
    flex: 1,
    height: 4,
    borderRadius: RAIOS.full,
    overflow: 'hidden',
  },
  progressoBarra: {
    height: 4,
    borderRadius: RAIOS.full,
  },
  progressoTexto: {
    fontSize: FONTES.pequena,
    fontWeight: 'bold',
    minWidth: 30,
  },

  acoes: {
    alignItems: 'center',
    gap: ESPACOS.sm,
  },
  botaoPlay: {
    padding: 2,
  },
  botaoLixo: {
    padding: 4,
  },

  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACOS.md,
    padding: ESPACOS.xl,
  },
  vazioTitulo: {
    fontSize: FONTES.grande,
    fontWeight: '600',
    textAlign: 'center',
  },
  vazioSub: {
    fontSize: FONTES.normal,
    textAlign: 'center',
    lineHeight: 20,
  },
});
