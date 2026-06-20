import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Tipos ----
export interface Podcast {
  id: string;
  nome: string;
  url: string;
  capa: string;
  descricao?: string;
  autor?: string;
  dataAssinatura: string;
}

export interface Radio {
  id: string;
  nome: string;
  url: string;
  capa: string;
}

export interface FeedRSS {
  id: string;
  nome: string;
  url: string;
  capa: string;
  descricao?: string;
}

export interface Episodio {
  id: string;
  titulo: string;
  url: string;
  capa: string;
  duracao?: number;
  data?: string;
  descricao?: string;
  podcastNome?: string;
  podcastUrl?: string;
  offline?: boolean;
  caminhoLocal?: string;
}

export interface Download {
  id: string;
  titulo: string;
  url: string;
  urlOriginal: string;
  capa: string;
  data: string;
  podcastNome?: string;
  podcastUrl?: string;
  offline: boolean;
  caminhoLocal?: string;
  progresso?: number;
}

export interface PlayerEstado {
  url: string;
  titulo: string;
  subtitulo: string;
  capa: string;
  tocando: boolean;
  tempo: number;
  duracao: number;
  velocidade: number;
}

// ---- Store de Configurações ----
interface ConfigStore {
  temaEscuro: boolean;
  corDestaque: string;
  setTemaEscuro: (v: boolean) => void;
  setCorDestaque: (v: string) => void;
  carregar: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  temaEscuro: true,
  corDestaque: '#FF9800',
  setTemaEscuro: async (v) => {
    set({ temaEscuro: v });
    await AsyncStorage.setItem('temaMochilaNex', v ? 'escuro' : 'claro');
  },
  setCorDestaque: async (v) => {
    set({ corDestaque: v });
    await AsyncStorage.setItem('corDestaqueMochilaNex', v);
  },
  carregar: async () => {
    const tema = await AsyncStorage.getItem('temaMochilaNex');
    const cor = await AsyncStorage.getItem('corDestaqueMochilaNex');
    set({
      temaEscuro: tema !== 'claro',
      corDestaque: cor || '#FF9800',
    });
  },
}));

// ---- Store de Podcasts ----
interface PodcastStore {
  podcasts: Podcast[];
  carregar: () => Promise<void>;
  adicionar: (p: Podcast) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

export const usePodcastStore = create<PodcastStore>((set, get) => ({
  podcasts: [],
  carregar: async () => {
    const raw = await AsyncStorage.getItem('meusPodcasts');
    const lista = raw ? JSON.parse(raw) : [];
    set({ podcasts: lista });
  },
  adicionar: async (p) => {
    const lista = [...get().podcasts, p];
    set({ podcasts: lista });
    await AsyncStorage.setItem('meusPodcasts', JSON.stringify(lista));
  },
  remover: async (id) => {
    const lista = get().podcasts.filter((p) => p.id !== id);
    set({ podcasts: lista });
    await AsyncStorage.setItem('meusPodcasts', JSON.stringify(lista));
  },
}));

// ---- Store de Rádios ----
interface RadioStore {
  radios: Radio[];
  carregar: () => Promise<void>;
  adicionar: (r: Radio) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

export const useRadioStore = create<RadioStore>((set, get) => ({
  radios: [],
  carregar: async () => {
    const raw = await AsyncStorage.getItem('minhasRadios');
    set({ radios: raw ? JSON.parse(raw) : [] });
  },
  adicionar: async (r) => {
    const lista = [...get().radios, r];
    set({ radios: lista });
    await AsyncStorage.setItem('minhasRadios', JSON.stringify(lista));
  },
  remover: async (id) => {
    const lista = get().radios.filter((r) => r.id !== id);
    set({ radios: lista });
    await AsyncStorage.setItem('minhasRadios', JSON.stringify(lista));
  },
}));

// ---- Store de Feeds RSS ----
interface FeedStore {
  feeds: FeedRSS[];
  carregar: () => Promise<void>;
  adicionar: (f: FeedRSS) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  feeds: [],
  carregar: async () => {
    const raw = await AsyncStorage.getItem('meusFeedsRSS');
    set({ feeds: raw ? JSON.parse(raw) : [] });
  },
  adicionar: async (f) => {
    const lista = [...get().feeds, f];
    set({ feeds: lista });
    await AsyncStorage.setItem('meusFeedsRSS', JSON.stringify(lista));
  },
  remover: async (id) => {
    const lista = get().feeds.filter((f) => f.id !== id);
    set({ feeds: lista });
    await AsyncStorage.setItem('meusFeedsRSS', JSON.stringify(lista));
  },
}));

// ---- Store de Downloads ----
interface DownloadStore {
  downloads: Download[];
  carregar: () => Promise<void>;
  adicionar: (d: Download) => Promise<void>;
  remover: (id: string) => Promise<void>;
  atualizar: (id: string, dados: Partial<Download>) => void;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: [],
  carregar: async () => {
    const raw = await AsyncStorage.getItem('episodiosBaixados');
    set({ downloads: raw ? JSON.parse(raw) : [] });
  },
  adicionar: async (d) => {
    const lista = [d, ...get().downloads];
    set({ downloads: lista });
    await AsyncStorage.setItem('episodiosBaixados', JSON.stringify(lista));
  },
  remover: async (id) => {
    const lista = get().downloads.filter((d) => d.id !== id);
    set({ downloads: lista });
    await AsyncStorage.setItem('episodiosBaixados', JSON.stringify(lista));
  },
  atualizar: (id, dados) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...dados } : d
      ),
    }));
  },
}));

// ---- Store do Player ----
interface PlayerStore {
  estado: PlayerEstado | null;
  setEstado: (e: PlayerEstado | null) => void;
  setTocando: (v: boolean) => void;
  setTempo: (v: number) => void;
  setDuracao: (v: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  estado: null,
  setEstado: (e) => set({ estado: e }),
  setTocando: (v) =>
    set((s) => ({ estado: s.estado ? { ...s.estado, tocando: v } : null })),
  setTempo: (v) =>
    set((s) => ({ estado: s.estado ? { ...s.estado, tempo: v } : null })),
  setDuracao: (v) =>
    set((s) => ({ estado: s.estado ? { ...s.estado, duracao: v } : null })),
}));
