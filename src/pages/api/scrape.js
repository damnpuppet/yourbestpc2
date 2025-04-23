// pages/api/scrape.js

import axios from 'axios';
import cheerio from 'cheerio';

// Cabeceras para simular un navegador y evitar bloqueos
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0'
};

// Función helper para parsear precios limpiando caracteres
function parsePrice(priceText) {
  // Elimina todo lo que no sea dígito, coma o punto
  const clean = priceText.replace(/[^\d,.-]/g, '').trim();
  // Quita puntos de miles y convierte la coma decimal
  return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
}

// Selector y extracción comunes
async function fetchProducts(url, listSelector, nameSelector, priceSelector, imgSelector, componentType) {
  const res = await axios.get(url, { headers });
  const $ = cheerio.load(res.data);
  const products = [];

  $(listSelector).each((i, el) => {
    if (i >= 10) return; // Solo primeros 10
    const name = $(el).find(nameSelector).text().trim();
    const priceText = $(el).find(priceSelector).text().trim();
    const price = parsePrice(priceText);
    const imageUrl = $(el).find(imgSelector).attr('src') || '';

    // Score básico según marca/modelo
    let score = 50;
    if (componentType === 'cpu') {
      if (name.match(/Ryzen 9|Core i9/)) score += 30;
      else if (name.match(/Ryzen 7|Core i7/)) score += 25;
      else if (name.match(/Ryzen 5|Core i5/)) score += 20;
      else if (name.match(/Ryzen 3|Core i3/)) score += 15;
    } else if (componentType === 'gpu') {
      if (name.match(/RTX 40|RX 7/)) score += 30;
      else if (name.match(/RTX 30|RX 6/)) score += 25;
      else if (name.match(/GTX 16|RX 5/)) score += 20;
    }

    products.push({
      id: `${componentType}-${i}`,
      name,
      brand: name.split(' ')[0],
      model: name,
      specs: {},
      price: price,
      imageUrl,
      score,
      type: componentType
    });
  });

  return products;
}

async function searchPcComponentes(type, query = '') {
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
  return fetchProducts(
    url,
    '.tarjeta-articulo',
    '.titulo-producto a',
    '.tarjeta-articulo__precio-actual',
    '.imagen-producto img',
    type
  );
}

async function searchCoolMod(type, query = '') {
  let url;
  if (query) {
    url = `https://www.coolmod.com/search/${encodeURIComponent(query)}/`;
  } else {
    const map = {
      cpu: 'procesadores-cpu',
      gpu: 'tarjetas-graficas',
      ram: 'memorias-ram',
      motherboard: 'placas-base',
      storage: 'almacenamiento',
      psu: 'fuentes-alimentacion',
      case: 'cajas-pc'
    };
    url = `https://www.coolmod.com/${map[type] || 'componentes-pc'}/`;
  }
  return fetchProducts(
    url,
    '.product-item',
    '.product-title',
    '.price',
    '.product-image img',
    type
  );
}

function combineResults(a, b) {
  const combined = [...a.map(p => ({
    ...p,
    price: { pccomponentes: p.price, coolmod: 0 }
  }))];

  b.forEach(bProd => {
    const match = combined.find(aProd => {
      const aName = aProd.name.toLowerCase().slice(0, 10);
      const bName = bProd.name.toLowerCase().slice(0, 10);
      return aName === bName;
    });
    if (match) {
      match.price.coolmod = bProd.price;
    } else {
      combined.push({
        ...bProd,
        price: { pccomponentes: 0, coolmod: bProd.price }
      });
    }
  });

  return combined;
}

export default async function handler(req, res) {
  const { type, query } = req.query;
  if (!type) {
    return res.status(400).json({ error: 'Falta el parámetro type' });
  }

  try {
    // Ejecutar ambas búsquedas en paralelo
    const [pcResults, cmResults] = await Promise.all([
      searchPcComponentes(type, query),
      searchCoolMod(type, query)
    ]);

    const results = combineResults(pcResults, cmResults);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(results);
  } catch (err) {
    console.error('Error en /api/scrape:', err);
    return res.status(500).json({ error: 'Error interno al procesar la solicitud' });
  }
}
