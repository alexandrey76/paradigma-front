// src/pages/CatalogPage.jsx
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import products from "../data/products";

// ⬅️ Стрелка назад
const BackArrow = styled.button`
  display: flex;
  align-items: center;
  margin-right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  img {
    width: 14px;
    height: 14px;
  }
`;

const PageWrapper = styled.div`
  background: #000;
  min-height: 100vh;
  color: white;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
`;

const Title = styled.span`
  font-weight: bold;
  font-size: 16px;
  color: black;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
`;

const Card = styled.div`
  background: transparent;
  border: 42x solid #f5a300;
  border-radius: 10px;
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
  border: 2px solid #000000ff;
  border-radius: 6px;
  padding: 6px;
  margin-top: 8px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5a300;
  }

  img.cart-icon {
    width: 24px;
    height: 24px;
  }
`;

const ImgWrap = styled.div`
  border: 2px solid #f5b300;   /* жёлтая рамка */
  border-radius: 10px;         /* закругления, как в корзине */
  overflow: hidden;            /* чтобы картинка не вылезала за края */
  aspect-ratio: 1 / 1;         /* квадрат */
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;


export default function CatalogPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {/* 🔙 Заголовок с кнопкой "назад" */}
      <Header>
        <BackArrow onClick={() => navigate(-1)}>
          <img
            src={`${process.env.PUBLIC_URL}/assets/images/backArrow.svg`}
            alt="Назад"
          />
        </BackArrow>
        <Title>Каталог товаров</Title>
      </Header>

      <Grid>
        {products.map((p) => (
          <Card key={p.id}>
            <Link to={`/product/${p.id}`}>
              <ImgWrap>
                <ProductImage src={p.images[0]} alt={p.name} />
              </ImgWrap>
            </Link>
            <Info>
              <Price>{p.price.toLocaleString("ru-RU")} руб</Price>
              <Name>{p.name}</Name>
              <CartButton>
                <img
                  src={`${process.env.PUBLIC_URL}/assets/images/productCart.svg`}
                  alt="Добавить в корзину"
                  className="cart-icon"
                />
              </CartButton>
            </Info>
          </Card>
        ))}
      </Grid>
    </PageWrapper>
  );
}
