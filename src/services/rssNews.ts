import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
});

export interface ArtigoRSS {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: string;
  link: string;
  data: string;
  imagem: string;
  feedNome: string;
  feedUrl: string;
  lido: boolean;
}

export interface FeedInfo {
  nome: string;
  descricao: string;
  capa: string;
  artigos: ArtigoRSS[];
}

const HEADERS = {
  'User-Agent': 'MochilaNex/1.0 (Android; Mobile) NewsReader',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

function extrairImagem(item: any): string {
  // Tenta várias origens de imagem
  if (item['media:content']?.['@_url']) return item['media:content']['@_url'];
  if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url'];
  if (item.enclosure?.['@_type']?.startsWith('image')) return item.enclosure['@_url'];

  // Tenta extrair do conteúdo HTML
  const html = item['content:encoded']?.['__cdata'] || item['content:encoded'] || item.description?.['__cdata'] || item.description || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

  return '';
}

function limparHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function buscarFeedNoticias(url: string): Promise<FeedInfo> {
  const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const parsed = parser.parse(res.data);
  const channel = parsed?.rss?.channel || parsed?.feed || {};

  const nome = channel.title?.['__cdata'] || channel.title?.['#text'] || channel.title || '';
  const descricao = channel.description?.['__cdata'] || channel.description?.['#text'] || channel.description || '';

  let capa = '';
  if (channel.image?.url) capa = channel.image.url;
  if (channel['itunes:image']?.['@_href']) capa = channel['itunes:image']['@_href'];

  const itens = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

  const artigos: ArtigoRSS[] = itens.slice(0, 50).map((item: any, i: number) => {
    const descRaw = item.description?.['__cdata'] || item.description?.['#text'] || item.description || '';
    const contRaw = item['content:encoded']?.['__cdata'] || item['content:encoded'] || descRaw;

    return {
      id: item.guid?.['__cdata'] || item.guid?.['#text'] || item.guid || item.link || `${url}-${i}`,
      titulo: item.title?.['__cdata'] || item.title?.['#text'] || item.title || 'Sem título',
      descricao: limparHtml(descRaw).substring(0, 300),
      conteudo: contRaw,
      link: item.link?.['#text'] || item.link || '',
      data: item.pubDate || item.published || '',
      imagem: extrairImagem(item),
      feedNome: nome,
      feedUrl: url,
      lido: false,
    };
  });

  return { nome, descricao, capa, artigos };
}

export function formatarDataArtigo(data: string): string {
  if (!data) return '';
  try {
    const d = new Date(data);
    const agora = new Date();
    const diff = agora.getTime() - d.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 60) return `há ${minutos}min`;
    if (horas < 24) return `há ${horas}h`;
    if (dias < 7) return `há ${dias}d`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return data;
  }
}
