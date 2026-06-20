import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

export interface EpisodioRSS {
  id: string;
  titulo: string;
  url: string;
  capa: string;
  duracao: string;
  data: string;
  descricao: string;
  podcastNome: string;
  podcastUrl: string;
}

export interface PodcastInfo {
  nome: string;
  capa: string;
  descricao: string;
  autor: string;
  episodios: EpisodioRSS[];
}

// Headers que simulam navegador real — evita bloqueios
const HEADERS = {
  'User-Agent': 'MochilaNex/1.0 (Android; Mobile) PodcastApp',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

export async function buscarFeed(url: string): Promise<PodcastInfo> {
  const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return parseFeed(res.data, url);
}

export function parseFeed(xml: string, feedUrl: string): PodcastInfo {
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel || parsed?.feed || {};

  const nome = channel.title?.['#text'] || channel.title || '';
  const descricao = channel.description?.['#text'] || channel.description || channel.subtitle || '';
  const autor = channel['itunes:author'] || channel.author?.name || '';

  // Capa
  let capa = '';
  if (channel['itunes:image']) {
    capa = channel['itunes:image']?.['@_href'] || channel['itunes:image'] || '';
  }
  if (!capa && channel.image?.url) capa = channel.image.url;

  // Episódios
  const itens = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const episodios: EpisodioRSS[] = itens.slice(0, 100).map((item: any, i: number) => {
    const audioUrl =
      item.enclosure?.['@_url'] ||
      item['media:content']?.['@_url'] ||
      item.link || '';

    const capEp =
      item['itunes:image']?.['@_href'] ||
      item['media:thumbnail']?.['@_url'] ||
      capa;

    return {
      id: item.guid?.['#text'] || item.guid || `${feedUrl}-${i}`,
      titulo: item.title?.['#text'] || item.title || 'Sem título',
      url: audioUrl,
      capa: capEp,
      duracao: item['itunes:duration'] || '',
      data: item.pubDate || item.published || '',
      descricao: item.description?.['#text'] || item.description || item['content:encoded'] || '',
      podcastNome: nome,
      podcastUrl: feedUrl,
    };
  });

  return { nome, capa, descricao, autor, episodios };
}

// Busca podcast no iTunes
export async function buscarPodcastItunes(termo: string) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&media=podcast&limit=20&country=BR`;
  const res = await axios.get(url, { timeout: 10000 });
  return res.data.results || [];
}

// Detecta URL de áudio válida no feed
export function temAudio(url: string): boolean {
  return /\.(mp3|m4a|ogg|aac|wav|opus)(\?.*)?$/i.test(url) || url.includes('audio');
}

// Formata duração HH:MM:SS ou segundos
export function formatarDuracao(duracao: string | number): string {
  if (!duracao) return '';
  if (typeof duracao === 'number') {
    const h = Math.floor(duracao / 3600);
    const m = Math.floor((duracao % 3600) / 60);
    const s = duracao % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return String(duracao);
}

// Formata data para pt-BR
export function formatarData(data: string): string {
  if (!data) return '';
  try {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return data;
  }
}
