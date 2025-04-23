// src/pages/index.js

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { getOptimalBuild } from '../utils/buildOptimizer';

export default function Home() {
  const [build, setBuild] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función de fetch parametrizable
  const fetchBuild = useCallback(async ({ budget, useCase, query }) => {
    setLoading(true);
    setError(null);

    try {
      const types = ['cpu','gpu','ram','motherboard','storage','psu','case'];

      // Ejecutamos todas las peticiones en paralelo
      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/scrape?type=${type}&query=${encodeURIComponent(query)}`)
            .then(res => {
              if (!res.ok) throw new Error(`Error ${res.status} en ${type}`);
              return res.json();
            })
        )
      );

      // DEBUG: log de longitudes de cada array
      types.forEach((type, i) => {
        console.log(`[DEBUG] ${type} → recibidos:`, results[i].length);
      });

      // Formateamos en objeto { cpu: [...], gpu: [...], … }
      const comps = types.reduce((o, type, i) => {
        o[type] = results[i];
        return o;
      }, {});

      // Validación: que no estén vacíos
      types.forEach(type => {
        if (!comps[type] || comps[type].length === 0) {
          throw new Error(`No se encontraron resultados para "${type}"`);
        }
      });

      // Calculamos la build óptima
      const { build: best, totalCost } = getOptimalBuild(comps, budget, useCase);
      setBuild(best);
      setTotalCost(totalCost);
    } catch (e) {
      console.error('Error en montaje:', e);
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lanza una build por defecto al cargar la página
  useEffect(() => {
    fetchBuild({ budget: 1000, useCase: 'gaming', query: '' });
  }, [fetchBuild]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">My PC Builder</h1>
      <SearchBar onSearch={fetchBuild} />

      {loading && <p className="mt-4">Montando tu PC…</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {build && (
        <>
          <h2 className="mt-6 text-xl">
            Configuración recomendada (Total: {totalCost} €)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-
