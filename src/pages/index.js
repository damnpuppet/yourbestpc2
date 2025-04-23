// Dentro de Home()
const handleSearch = async ({ budget, useCase, query }) => {
  setLoading(true);
  setError(null);
  try {
    const types = ['cpu','gpu','ram','motherboard','storage','psu','case'];
    const results = await Promise.all(
      types.map(type =>
        fetch(`/api/scrape?type=${type}&query=${encodeURIComponent(query)}`)
          .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status} en ${type}`);
            return res.json();
          })
      )
    );

    // 👉 DEBUG: comprueba longitudes de cada array
    types.forEach((type, idx) => {
      console.log(`${type} → recibidos:`, results[idx].length);
    });

    const comps = types.reduce((o, t, i) => ((o[t] = results[i]), o), {});
    const { build: best, totalCost } = getOptimalBuild(comps, budget, useCase);
    setBuild(best);
    setTotalCost(totalCost);
  } catch (e) {
    console.error('Error en montaje:', e);
    setError(`Error: ${e.message}`);
  } finally {
    setLoading(false);
  }
};
