import products from "../data/products";
import { Link } from "react-router-dom";

export default function CatalogPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Каталог товаров</h1>
      <div style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))"
      }}>
        {products.map(p => (
          <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <img src={p.images[0]} alt={p.name}
                 style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
            <h3 style={{ margin: "8px 0" }}>{p.name}</h3>
            <div style={{ color: "#666", marginBottom: 8 }}>
              {p.price.toLocaleString("ru-RU")} ₽
            </div>
            <Link to={`/product/${p.id}`}><button>Подробнее</button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
