import { Appearance } from 'react-native';

export const CORES = {
  destaque: '#FF9800',
  destaqueEscuro: '#E65100',
  destaqueFundo: 'rgba(255,152,0,0.12)',

  // Tema escuro
  escuro: {
    fundo: '#121212',
    fundoCard: '#1E1E1E',
    fundoSecundario: '#2A2A2A',
    borda: '#333333',
    texto: '#FFFFFF',
    textoSecundario: '#AAAAAA',
    textoDesabilitado: '#555555',
    icone: '#FFFFFF',
  },

  // Tema claro
  claro: {
    fundo: '#F5F5F5',
    fundoCard: '#FFFFFF',
    fundoSecundario: '#EEEEEE',
    borda: '#DDDDDD',
    texto: '#111111',
    textoSecundario: '#666666',
    textoDesabilitado: '#AAAAAA',
    icone: '#333333',
  },
};

export function getTema(escuro: boolean) {
  return escuro ? CORES.escuro : CORES.claro;
}

export const FONTES = {
  pequena: 11,
  normal: 13,
  media: 15,
  grande: 17,
  titulo: 20,
};

export const ESPACOS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RAIOS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};
