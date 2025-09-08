import { Link, useParams } from "react-router-dom";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import ParallaxCarousel from "../components/ParallaxCarousel";

export default function ProductPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === Number(id));
  const { addItem } = useCart();

  if (!product) return <div className="container">Товар не найден</div>;

  const media = [
    ...(product.videos || []).map(v => ({ type: "video", mp4: v })),
    ...(product.images || []).map(src => ({ type: "image", src }))
  ];

  return (
    <div className="container">
      <Link to="/">← В каталог</Link>
      <h1 style={{ margin: "8px 0 16px" }}>{product.name}</h1>

      <div className="productLayout">
        {/* Галерея */}
        <div
          className="mediaWrap"
          style={{
            width: 400,       // фиксируем окно
            height: 400,
            border: "2px solid white", // чтобы было видно рамку
            borderRadius: 12,
            overflow: "hidden"
          }}
        >
          <ParallaxCarousel media={media} height="400" fit="contain" speed={0.2} />
        </div>


        {/* Детали товара */}
        <div className="details">
          <p className="muted">{product.description}</p>
          <h2 style={{ margin: "12px 0 16px" }}>
            {product.price.toLocaleString("ru-RU")} ₽
          </h2>
          <div className="btn-row">
            <button className="btn" onClick={() => addItem(product)}>Добавить в корзину</button>
            <Link to="/cart" className="btn secondary">Перейти в корзину</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
