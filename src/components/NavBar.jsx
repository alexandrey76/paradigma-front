// src/components/NavBar.jsx
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useCart } from "../context/CartContext";

export default function NavBar() {
  const { pathname } = useLocation();
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <Wrap>
      <Bar role="navigation" aria-label="Нижняя навигация">
        <IconLink to="/" $active={pathname === "/"}>
          <LogoIcon />
        </IconLink>

        <IconLink to="/catalog" $active={pathname.startsWith("/catalog")}>
          <CatalogIcon />
        </IconLink>

        {/* Корзина с бейджем */}
        <CartWrapper>
          <IconLink to="/cart" $active={pathname.startsWith("/cart")}>
            <CartIcon />
          </IconLink>
          {totalQty > 0 && <CartBadge>{totalQty > 9 ? "9+" : totalQty}</CartBadge>}
        </CartWrapper>

        <IconLink to="/profile" $active={pathname.startsWith("/profile")}>
          <UserIcon />
        </IconLink>

        <IconLink to="/support" $active={pathname.startsWith("/support")}>
          <ChatIcon />
        </IconLink>
      </Bar>
    </Wrap>
  );
}

/* ---------- styled ---------- */

const Wrap = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 9999;
  padding: 20px 10px calc(12px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  pointer-events: none;
`;

const Bar = styled.div`
  pointer-events: auto;
  width: 100%;
  max-width: 560px;
  background: #f5b300;
  border-radius: 14px;
  height: 56px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  justify-items: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
`;

const IconLink = styled(Link)`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  text-decoration: none;
  background: ${(p) => (p.$active ? "linear-gradient(180deg, #906606 0%, #7b5a09 100%)" : "transparent")};
  box-shadow: ${(p) => (p.$active ? "inset 0 3px 8px rgba(0,0,0,0.35)" : "none")};

  img {
    width: 26px;
    height: 26px;
    opacity: ${(p) => (p.$active ? 1 : 0.9)};
    transition: transform 120ms ease, opacity 120ms ease;
  }

  &:active img {
    transform: scale(0.94);
  }
`;

/* Обертка корзины для бейджа */
const CartWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

/* Бейдж с количеством товаров */
const CartBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 2px;
  width: 14px;
  height: 14px;
  padding: 0 4px;
  border-radius: 50%;
  background: #f5b300;
  border: 2px solid #fff;
  font-size: 7px;
  font-weight: 800;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

/* ---------- SVG иконки ---------- */
function LogoIcon() {
  return <img src="/assets/images/barLogo.svg" alt="logo" width={26} height={26} />;
}
function CartIcon() {
  return <img src="/assets/images/barCart.svg" alt="cart" width={26} height={26} />;
}
function UserIcon() {
  return <img src="/assets/images/barProfile.svg" alt="profile" width={26} height={26} />;
}
function ChatIcon() {
  return <img src="/assets/images/barChat.svg" alt="chat" width={26} height={26} />;
}
function CatalogIcon() {
  return <img src="/assets/images/barCatalog.svg" alt="catalog" width={26} height={26} />;
}
