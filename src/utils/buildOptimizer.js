// src/utils/buildOptimizer.js

const WEIGHTS = {
  programming:   { cpu: 0.4, gpu: 0.1, ram: 0.2, motherboard: 0.1, storage: 0.1, psu: 0.05, case: 0.05 },
  gaming:        { cpu: 0.2, gpu: 0.4, ram: 0.15, motherboard: 0.1, storage: 0.1, psu: 0.03, case: 0.02 },
  render:        { cpu: 0.4, gpu: 0.3, ram: 0.15, motherboard: 0.05, storage: 0.05, psu: 0.03, case: 0.02 },
  all:           { cpu: 0.25, gpu: 0.25, ram: 0.2, motherboard: 0.1, storage: 0.1, psu: 0.05, case: 0.05 }
};

/**
 * components: { cpu:[...], gpu:[...], ram:[...], ... }
 * budget: número
 * useCase: uno de 'programming','gaming','render','all'
 */
export function getOptimalBuild(components, budget, useCase) {
  const weights = WEIGHTS[useCase] || WEIGHTS.all;
  const selected = {};
  let totalCost = 0;

  Object.entries(components).forEach(([type, list]) => {
    // Calcula eficiencia = score/precio
    const scored = list.map(item => {
      const price = item.price.pccomponentes + item.price.coolmod;
      const efficiency = price > 0 ? item.score / price : 0;
      return { item, value: efficiency * (weights[type] || 0) };
    });
    const best = scored.sort((a, b) => b.value - a.value)[0];
    selected[type] = best.item;
    totalCost += best.item.price.pccomponentes + best.item.price.coolmod;
  });

  // Si supera presupuesto, baja primero GPU y luego CPU
  if (totalCost > budget) {
    ['gpu','cpu'].forEach(type => {
      if (totalCost <= budget) return;
      const list = components[type];
      const options = list
        .map(item => {
          const price = item.price.pccomponentes + item.price.coolmod;
          const efficiency = price > 0 ? item.score / price : 0;
          return { item, value: efficiency };
        })
        .sort((a, b) => b.value - a.value);

      const idx = options.findIndex(o => o.item.id === selected[type].id);
      const next = options[idx + 1];
      if (next) {
        totalCost -= (selected[type].price.pccomponentes + selected[type].price.coolmod);
        selected[type] = next.item;
        totalCost += next.item.price.pccomponentes + next.item.price.coolmod;
      }
    });
  }

  return { build: selected, totalCost: totalCost.toFixed(2) };
}
