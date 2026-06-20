import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useConfigStore } from '../store';
import { CORES, FONTES, ESPACOS, RAIOS } from '../theme';
import { exportarBackup, importarBackup, importarMochilaNexAntigo } from '../services/backup';
import { solicitarPermissao, registrarVerificacaoBackground, cancelarVerificacaoBackground } from '../services/notifications';

const CORES_DESTAQUE = [
  { cor: '#FF9800', nome: 'Laranja' },
  { cor: '#4CAF50', nome: 'Verde' },
  { cor: '#2196F3', nome: 'Azul' },
  { cor: '#E91E63', nome: 'Rosa' },
  { cor: '#9C27B0', nome: 'Roxo' },
  { cor: '#00BCD4', nome: 'Ciano' },
  { cor: '#FF5722', nome: 'Vermelho' },
  { cor: '#FFEB3B', nome: 'Amarelo' },
];

export default function ConfiguracoesScreen({ navigation }: any) {
  const { temaEscuro, corDestaque, setTemaEscuro, setCorDestaque } = useConfigStore();
  const tema = temaEscuro ? CORES.escuro : CORES.claro;

  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [notificacoes, setNotificacoes] = useState(false);

  async function fazerBackup() {
    setExportando(true);
    try {
      await exportarBackup();
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o backup.');
    } finally {
      setExportando(false);
    }
  }

  async function restaurarBackup() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;

      setImportando(true);
      const conteudo = await FileSystem.readAsStringAsync(resultado.assets[0].uri);
      const { sucesso, mensagem } = await importarBackup(conteudo);
      Alert.alert(sucesso ? 'Sucesso!' : 'Erro', mensagem);
    } catch {
      Alert.alert('Erro', 'Não foi possível ler o arquivo.');
    } finally {
      setImportando(false);
    }
  }

  async function importarDadosAntigos() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;

      setImportando(true);
      const conteudo = await FileSystem.readAsStringAsync(resultado.assets[0].uri);
      const { sucesso, mensagem } = await importarMochilaNexAntigo(conteudo);
      Alert.alert(sucesso ? 'Importado!' : 'Erro', mensagem);
    } catch {
      Alert.alert('Erro', 'Não foi possível ler o arquivo.');
    } finally {
      setImportando(false);
    }
  }

  async function alternarNotificacoes(valor: boolean) {
    if (valor) {
      const permitido = await solicitarPermissao();
      if (!permitido) {
        Alert.alert('Permissão negada', 'Ative as notificações nas configurações do Android.');
        return;
      }
      await registrarVerificacaoBackground();
    } else {
      await cancelarVerificacaoBackground();
    }
    setNotificacoes(valor);
  }

  const Secao = ({ titulo }: { titulo: string }) => (
    <Text style={[styles.secaoTitulo, { color: tema.textoDesabilitado }]}>{titulo}</Text>
  );

  const ItemConfig = ({
    icone, titulo, subtitulo, onPress, direita, cor,
  }: {
    icone: string; titulo: string; subtitulo?: string;
    onPress?: () => void; direita?: React.ReactNode; cor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.itemIcone, { backgroundColor: (cor || corDestaque) + '20' }]}>
        <Ionicons name={icone as any} size={20} color={cor || corDestaque} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitulo, { color: tema.texto }]}>{titulo}</Text>
        {subtitulo && <Text style={[styles.itemSub, { color: tema.textoSecundario }]}>{subtitulo}</Text>}
      </View>
      {direita || (onPress && <Ionicons name="chevron-forward" size={18} color={tema.textoDesabilitado} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.fundo }]}>
      <View style={[styles.header, { backgroundColor: tema.fundoCard, borderBottomColor: tema.borda }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tema.texto} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: corDestaque }]}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Aparência */}
        <Secao titulo="APARÊNCIA" />

        <ItemConfig
          icone={temaEscuro ? 'moon' : 'sunny'}
          titulo="Tema escuro"
          subtitulo={temaEscuro ? 'Ativado' : 'Desativado'}
          direita={
            <Switch
              value={temaEscuro}
              onValueChange={setTemaEscuro}
              trackColor={{ false: tema.borda, true: corDestaque + '80' }}
              thumbColor={temaEscuro ? corDestaque : tema.textoDesabilitado}
            />
          }
        />

        <View style={[styles.item, { backgroundColor: tema.fundoCard, borderColor: tema.borda }]}>
          <View style={[styles.itemIcone, { backgroundColor: corDestaque + '20' }]}>
            <Ionicons name="color-palette" size={20} color={corDestaque} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitulo, { color: tema.texto }]}>Cor destaque</Text>
            <View style={styles.coresGrid}>
              {CORES_DESTAQUE.map((c) => (
                <TouchableOpacity
                  key={c.cor}
                  style={[styles.bolaCor, { backgroundColor: c.cor, borderWidth: corDestaque === c.cor ? 3 : 0, borderColor: '#fff' }]}
                  onPress={() => setCorDestaque(c.cor)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Notificações */}
        <Secao titulo="NOTIFICAÇÕES" />

        <ItemConfig
          icone="notifications"
          titulo="Novos episódios"
          subtitulo="Notificar quando houver novos episódios"
          direita={
            <Switch
              value={notificacoes}
              onValueChange={alternarNotificacoes}
              trackColor={{ false: tema.borda, true: corDestaque + '80' }}
              thumbColor={notificacoes ? corDestaque : tema.textoDesabilitado}
            />
          }
        />

        {/* Backup */}
        <Secao titulo="BACKUP E DADOS" />

        <ItemConfig
          icone="cloud-upload"
          titulo="Exportar backup"
          subtitulo="Salva podcasts, rádios e feeds"
          onPress={exportando ? undefined : fazerBackup}
          direita={exportando ? <ActivityIndicator color={corDestaque} /> : undefined}
        />

        <ItemConfig
          icone="cloud-download"
          titulo="Restaurar backup"
          subtitulo="Importa um backup .json"
          onPress={importando ? undefined : restaurarBackup}
          direita={importando ? <ActivityIndicator color={corDestaque} /> : undefined}
        />

        <ItemConfig
          icone="swap-horizontal"
          titulo="Importar do MochilaNex"
          subtitulo="Traz dados do app WebView anterior"
          cor="#4CAF50"
          onPress={importando ? undefined : importarDadosAntigos}
          direita={importando ? <ActivityIndicator color="#4CAF50" /> : undefined}
        />

        {/* Sobre */}
        <Secao titulo="SOBRE" />

        <ItemConfig
          icone="information-circle"
          titulo="MochilaNex RN"
          subtitulo="Versão 2.0 — React Native + Expo"
        />

        <ItemConfig
          icone="code-slash"
          titulo="Tecnologias"
          subtitulo="React Native · Expo · TrackPlayer · Zustand"
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.md,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: FONTES.grande, fontWeight: 'bold' },
  scroll: { padding: ESPACOS.md },
  secaoTitulo: {
    fontSize: FONTES.pequena,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: ESPACOS.lg,
    marginBottom: ESPACOS.sm,
    marginLeft: ESPACOS.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RAIOS.md,
    borderWidth: 1,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    gap: ESPACOS.md,
  },
  itemIcone: {
    width: 40,
    height: 40,
    borderRadius: RAIOS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemTitulo: { fontSize: FONTES.normal, fontWeight: '600' },
  itemSub: { fontSize: FONTES.pequena, marginTop: 2 },
  coresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACOS.sm,
    marginTop: ESPACOS.sm,
  },
  bolaCor: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
