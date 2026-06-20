import axios from 'axios';

export interface Radio {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  country: string;
  language: string;
  tags: string;
  votes: number;
  bitrate: number;
}

const SERVIDORES = [
  'https://de1.api.radio-browser.info',
  'https://fr1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];

function servidor() {
  return SERVIDORES[Math.floor(Math.random() * SERVIDORES.length)];
}

const HEADERS = {
  'User-Agent': 'MochilaNex/1.0 (Android; Mobile) RadioApp',
};

export async function buscarRadios(termo: string): Promise<Radio[]> {
  const url = `${servidor()}/json/stations/byname/${encodeURIComponent(termo)}?limit=30&hidebroken=true&order=votes&reverse=true`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return res.data || [];
}

export async function radiosPopulares(pais = 'BR'): Promise<Radio[]> {
  const url = `${servidor()}/json/stations/bycountry/${pais}?limit=30&hidebroken=true&order=votes&reverse=true`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return res.data || [];
}

export async function radiosPopularesMundial(): Promise<Radio[]> {
  const url = `${servidor()}/json/stations?limit=30&hidebroken=true&order=votes&reverse=true`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return res.data || [];
}

export function formatarBitrate(bitrate: number): string {
  if (!bitrate) return '';
  return `${bitrate} kbps`;
}
