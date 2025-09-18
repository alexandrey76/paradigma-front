// src/pages/CatalogPage.jsx
import products from "../data/products";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

const PageWrapper = styled.div`
  background: #000;
  min-height: 100vh;
  color: white;
  padding: 16px;
  font-family: "Montserrat", sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
`;

const BackArrow = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-right: 12px;

  img {
    width: 16px;
    height: 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
`;

const Card = styled.div`
  background: transparent;
  border: 2px solid #000000ff; /* желтая рамка */
  border-radius: 8px;
  overflow: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProductImage = styled.img`
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border: 2px solid #f5a300; 
  border-radius: 6px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
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
  border: 2px solid #000000ff;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  img.cart-icon {
    width: 32px;
    height: 32px;
  }
`;

export default function CatalogPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {/* 🔙 Заголовок с кнопкой назад */}
      <Header>
        <BackArrow onClick={() => navigate(-1)}>
          <img src={`${process.env.PUBLIC_URL}/assets/images/backArrow.svg`} alt="Назад" />
        </BackArrow>
        <span style={{ fontWeight: "bold", color: "black" }}>Каталог товаров</span>
      </Header>

      {/* 🔲 Сетка товаров */}
      <Grid>
        {products.map((p) => (
          <Card key={p.id}>
            <Link to={`/product/${p.id}`}>
              <ProductImage src={p.images[0]} alt={p.name} />
            </Link>
            <InfoRow>
              <PriceBlock>
                <Price>{p.price.toLocaleString("ru-RU")} руб</Price>
                <Name>{p.name}</Name>
              </PriceBlock>
              <CartButton>
                <img src="/assets/images/productCart.svg" className="cart-icon" alt="cart" />
              </CartButton>
            </InfoRow>
          </Card>
        ))}
      </Grid>
    </PageWrapper>
  );
}
