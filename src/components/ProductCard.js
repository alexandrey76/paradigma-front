import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <img
        src={product.images[0]}
        alt={product.name}
        style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
      />
      <h3 style={{ margin: "6px 0" }}>{product.name}</h3>
      <div style={{ color: "#666", marginBottom: 8 }}>{product.price.toLocaleString("ru-RU")} ₽</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Link to={`/product/${product.id}`}><button>Поде</button></Link>
      </div>
    </div>
  );
}
