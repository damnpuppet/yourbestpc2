import { useState } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { getOptimalBuild } from '../utils/buildOptimizer';

export default function Home() {
  const [build, setBuild] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async ({ budget, useCase, query }) => {
    setLoading(true);
    setError(null);
    try {
      // 1) raspamos todos los tipos en paralelo
      const types = ['cpu','gpu','ram','motherboard','storage','psu','case'];
      const promises = types.map(type =>
        fetch(`/api/scrape?type=${type}&query=${encodeURIComponent(query)}`)
          .then(r => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
      );
      const results = await Promise.all(promises);
      // 2) formateamos en un objeto { cpu: [...], gpu: [...], … }
      const componentsByType = types.reduce((obj, type, i) => {
        obj[type] = results[i];
        return obj;
      }, {});
      // 3) optimizamos la build
      const { build: bestBuild, totalCost } = getOptimalBuild(componentsByType, budget, useCase);
      setBuild(bestBuild);
      setTotalCost(totalCost);
    } catch (e) {
      console.error(e);
      setError('No se pudo generar la configuración óptima.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">My PC Builder</h1>
      <SearchBar onSearch={handleSearch} />

      {loading && <p className="mt-4">Montando tu PC…</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {build && (
        <>
          <h2 className="mt-6 text-xl">Configuración recomendada (Total: {totalCost} €)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {Object.entries(build).map(([type, product]) => (
              <div key={type}>
                <h3 className="font-semibold capitalize">{type}</h3>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
