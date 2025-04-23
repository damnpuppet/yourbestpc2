import axios from 'axios';
import cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0'
};

export async function searchPcComponentes(type, query = '') {
  let url;
  if (query) {
    url = `https://www.pccomponentes.com/buscar/?query=${encodeURIComponent(query)}`;
  } else {
    const map = {
      cpu: 'procesadores',
      gpu: 'tarjetas-graficas',
      ram: 'memorias-ram',
      motherboard: 'placas-base',
      storage: 'discos-duros',
      psu: 'fuentes-de-alimentacion',
      case: 'cajas-pc'
    };
    url = `https://www.pccomponentes.com/${map[type] || 'componentes'}`;
  }
  const response = await axios.get(url, { headers });
  const $ = cheerio.load(response.data);
  const products = [];
  $('.tarjeta-articulo').each((i, el) => {
    if (i >= 10) return;
    const name = $(el).find('.titulo-producto a').text().trim();
    const priceText = $(el).find('.tarjeta-articulo__precio-actual').text().trim();
    const price = parsePrice(priceText);
    const imageUrl = $(el).find('.imagen-producto img').attr('src') || '';
    let score = 50;
    if (type === 'cpu') {
      if (name.match(/Ryzen 9|Core i9/)) score += 30;
      else if (name.match(/Ryzen 7|Core i7/)) score += 25;
      else if (name.match(/Ryzen 5|Core i5/)) score += 20;
      else if (name.match(/Ryzen 3|Core i3/)) score += 15;
    } else if (type === 'gpu') {
      if (name.match(/RTX 40|RX 7/)) score += 30;
      else if (name.match(/RTX 30|RX 6/)) score += 25;
      else if (name.match(/GTX 16|RX 5/)) score += 20;
    }
    products.push({
      id: `pc-${i}`,
      name,
      brand: name.split(' ')[0],
      model: name,
      specs: {},
      price,
      imageUrl,
      score,
      type
    });
  });
  return products;
}
