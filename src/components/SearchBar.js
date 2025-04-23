// src/components/SearchBar.js
import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [budget, setBudget] = useState(1000);
  const [useCase, setUseCase] = useState('gaming'); // gaming, programming, render, all
  const [query, setQuery] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSearch({ budget, useCase, query });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
      <input
        type="number"
        value={budget}
        onChange={e => setBudget(+e.target.value)}
        placeholder="Presupuesto (€)"
        className="border rounded p-1 w-32"
        min={0}
      />

      <select
        value={useCase}
        onChange={e => setUseCase(e.target.value)}
        className="border rounded p-1"
      >
        <option value="programming">Programación</option>
        <option value="gaming">Gaming</option>
        <option value="render">Render</option>
        <option value="all">Todo en uno</option>
      </select>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filtrar modelo (opcional)"
        className="border rounded p-1 flex-1"
      />

      <button type="submit" className="bg-blue-600 text-white rounded px-3 py-1">
        Montar PC
      </button>
    </form>
  );
}
