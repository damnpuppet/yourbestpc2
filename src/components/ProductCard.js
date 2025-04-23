// src/components/ProductCard.js

export default function ProductCard({ product }) {
  const { name, imageUrl, price, score } = product;
  return (
    <div className="border rounded shadow p-4 flex flex-col">
      <img
        src={imageUrl}
        alt={name}
        className="h-40 w-full object-contain mb-2"
      />
      <h2 className="font-semibold text-lg">{name}</h2>
      <div className="mt-2 space-y-1 flex-1">
        <p>PCComponentes: <strong>{price.pccomponentes.toFixed(2)} €</strong></p>
        <p>Coolmod:       <strong>{price.coolmod.toFixed(2)} €</strong></p>
      </div>
      <div className="mt-2">
        <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-0.5 rounded">
          Score: {score}
        </span>
      </div>
    </div>
  );
}
