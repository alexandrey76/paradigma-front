// src/components/NavBar.jsx  (стилизация компонента)
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useCart } from "../context/CartContext";

export default function NavBar() {
  const { pathname } = useLocation();
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <Wrap>
      <Bar role="navigation" aria-label="Нижняя навигация" data-testid="nav-bar">
        <IconLink to="/" $active={pathname === "/"}>
          <LogoIcon />
        </IconLink>

        <IconLink to="/catalog" $active={pathname.startsWith("/catalog")}>
          <CatalogIcon />
        </IconLink>

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

/* ====== стили ====== */

const NAVBAR_HEIGHT = 64;

const Wrap = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
  /* минимальный внешний отступ, можно регулировать */
  padding-bottom: env(safe-area-inset-bottom);
  pointer-events: none; /* клики идут только на кнопки внутри */
`;

/* Бар: адаптивно заполняет ширину на мобильных, но ограничивается на больших экранах */
const Bar = styled.nav`
  --nav-max: 760px; /* максимум ширины на больших экранах — подгони под себя */
  --side-gap: 16px; /* боковой отступ от краёв экрана */
  pointer-events: auto;
  width: min(calc(100% - (var(--side-gap) * 2)), var(--nav-max));
  max-width: var(--nav-max);
  height: ${NAVBAR_HEIGHT}px;
  background: transparent; /* фон будем рисовать внутри кнопок (у тебя svg с фоном) */
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px; /* небольшой gap между кнопками */
  align-items: center;
  justify-items: center;
  /* оставляем центрирование и лёгкую тень */
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
  border-radius: 14px;
`;

/* Ссылка-кнопка — теперь занимает всю ячейку и всю высоту бара */
const IconLink = styled(Link)`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 12px;
  text-decoration: none;
  padding: 6px; /* чтобы иконка не прилипала к краям */
  box-sizing: border-box;

  /* фон проявляется если кнопка активна — ты используешь svg с фоном, поэтому можно оставить прозрачным */
  background: ${(p) =>
    p.$active ? "linear-gradient(180deg, #906606 0%, #7b5a09 100%)" : "transparent"};
  box-shadow: ${(p) => (p.$active ? "inset 0 3px 8px rgba(0,0,0,0.35)" : "none")};

  img {
    width: 26px;
    height: 26px;
    display: block;
    opacity: ${(p) => (p.$active ? 1 : 0.95)};
    transition: transform 120ms ease, opacity 120ms ease;
  }

  &:active img {
    transform: scale(0.94);
  }
`;

/* Корзина + бейдж (позиционируется внутри своей ячейки) */
const CartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
`;

const CartBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #f5b300;
  border: 2px solid #fff;
  font-size: 11px;
  font-weight: 800;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

/* ====== иконки (твои svg-файлы) ====== */
function LogoIcon() { return <img src="/assets/images/barLogo.svg" alt="logo" width={26} height={26} />; }
function CartIcon() { return <img src="/assets/images/barCart.svg" alt="cart" width={26} height={26} />; }
function UserIcon() { return <img src="/assets/images/barProfile.svg" alt="profile" width={26} height={26} />; }
function ChatIcon() { return <img src="/assets/images/barChat.svg" alt="chat" width={26} height={26} />; }
function CatalogIcon() { return <img src="/assets/images/barCatalog.svg" alt="catalog" width={26} height={26} />; }
