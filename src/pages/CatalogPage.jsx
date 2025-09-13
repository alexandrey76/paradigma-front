// src/pages/CatalogPage.jsx
import products from "../data/products";
import { Link } from "react-router-dom";
import styled from "styled-components";

// Стили
const PageWrapper = styled.div`
  background: #000;
  min-height: 100vh;
  color: white;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
`;

const Card = styled.div`
  background: transparent;
  border: 2px solid #f5a300; /* желтая рамка */
  border-radius: 8px;
  overflow: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProductImage = styled.img`
  width: 100%;
  aspect-ratio: 1/1; /* квадратная картинка */
  object-fit: cover;
`;

const Info = styled.div`
  margin-top: 8px;
`;

const Price = styled.div`
  font-weight: bold;
  font-size: 16px;
`;

const Name = styled.div`
  font-size: 14px;
  color: #ccc;
`;

const CartButton = styled.button`
  background: none;
  border: 2px solid #f5a300;
  border-radius: 6px;
  padding: 6px;
  color: white;
  margin-top: 8px;
  cursor: pointer;

  &:hover {
    background: #f5a300;
    color: black;
  }
`;

export default function CatalogPage() {
  return (
    <PageWrapper>
      {/* 🔍 Заголовок с поиском */}
      <Header>
        <span style={{ fontWeight: "bold", color: "black" }}>Каталог товаров</span>
      </Header>

      {/* 🔲 Сетка товаров */}
      <Grid>
        {products.map((p) => (
          <Card key={p.id}>
            <Link to={`/product/${p.id}`}>
              <ProductImage src={p.images[0]} alt={p.name} />
            </Link>
            <Info>
              <Price>{p.price.toLocaleString("ru-RU")} руб</Price>
              <Name>{p.name}</Name>
              <CartButton>🛒</CartButton>
            </Info>
          </Card>
        ))}
      </Grid>
    </PageWrapper>
  );
}
