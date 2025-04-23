import { searchPcComponentes } from './pccomponentes';
import { searchCoolMod } from './coolmod';

export async function scrapeAll(type, query) {
  const [pcResults, cmResults] = await Promise.all([
    searchPcComponentes(type, query),
    searchCoolMod(type, query)
  ]);

  const combined = pcResults.map(p => ({
    ...p,
    price: { pccomponentes: p.price, coolmod: 0 }
  }));

  cmResults.forEach(p => {
    const match = combined.find(c => {
      const a = c.name.toLowerCase().slice(0, 10);
      const b = p.name.toLowerCase().slice(0, 10);
      return a === b;
    });
    if (match) {
      match.price.coolmod = p.price;
    } else {
      combined.push({
        ...p,
        price: { pccomponentes: 0, coolmod: p.price }
      });
    }
  });

  return combined;
}
