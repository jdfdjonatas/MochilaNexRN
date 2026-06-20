import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore, usePlayerStore } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { alternarPlayPause } from '../services/player';

export default function MiniPlayerBar() {
  const { temaEscuro, corDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;
  const { estado } = usePlayerStore();

  if (!estado) return null;

  const progresso = estado.duracao > 0 ? estado.tempo / estado.duracao : 0;

  return (
    <View style={[styles.container, { backgroundColor: tema.fundoCard, borderTopColor: tema.borda }]}>
      <View style={[styles.barraProgresso, { backgroundColor: tema.borda }]}>
        <View style={[styles.progresso, { backgroundColor: corDestaque, width: `${progresso * 100}%` }]} />
      </View>

      <View style={styles.conteudo}>
        {!!estado.capa && <Image source={{ uri: estado.capa }} style={styles.capa} />}

        <View style={styles.info}>
          <Text style={[styles.titulo, { color: tema.texto }]} numberOfLines={1}>
            {estado.titulo}
          </Text>
          {!!estado.subtitulo && (
            <Text style={[styles.subtitulo, { color: tema.textoSecundario }]} numberOfLines={1}>
              {estado.subtitulo}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={alternarPlayPause} style={styles.botaoPlay}>
          <Ionicons name={estado.tocando ? 'pause-circle' : 'play-circle'} size={40} color={corDestaque} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 60, // fica acima da tab bar (que tem height: 60)
    borderTopWidth: 1,
  },
  barraProgresso: { height: 2, width: '100%' },
  progresso: { height: 2 },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  capa: { width: 40, height: 40, borderRadius: RAIOS.sm },
  info: { flex: 1, marginHorizontal: ESPACOS.md },
  titulo: { fontSize: FONTES.normal, fontWeight: '600' },
  subtitulo: { fontSize: FONTES.pequena, marginTop: 2 },
  botaoPlay: { padding: 0 },
});
