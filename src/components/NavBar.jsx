// src/components/NavBar.jsx
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import makePointerPress from "../utils/makePointerPress";

export default function NavBar() {
  const { pathname } = useLocation();
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // какой таб сейчас зажат (pressed)
  const [pressedTab, setPressedTab] = useState(null);

  return (
    <Wrap>
      <Bar role="navigation" aria-label="Нижняя навигация" data-testid="nav-bar">
        <IconLink  {...makePointerPress(
            (isPressed) => setPressedTab(isPressed ? "home" : null),
            undefined
          )}
          $pressed={pressedTab === "home"}
          to="/"
          $active={pathname === "/"}>
          <LogoIcon />
        </IconLink>

        <IconLink   {...makePointerPress(
            (isPressed) => setPressedTab(isPressed ? "catalog" : null),
            undefined
          )}
          $pressed={pressedTab === "catalog"}
          to="/catalog"
          $active={pathname.startsWith("/catalog")}>
          <CatalogIcon />
        </IconLink>


        <CartWrapper>
          <IconLink {...makePointerPress(
            (isPressed) => setPressedTab(isPressed ? "cart" : null),
            undefined
          )}
          $pressed={pressedTab === "cart"}
          to="/cart"
          $active={pathname.startsWith("/cart")}>
            <CartIcon />
          </IconLink>
          {totalQty > 0 && (
            <CartBadge>{totalQty > 9 ? "9+" : totalQty}</CartBadge>
          )}
        </CartWrapper>

        <IconLink {...makePointerPress(
            (isPressed) => setPressedTab(isPressed ? "profile" : null),
            undefined
          )}
          $pressed={pressedTab === "profile"}
          to="/profile"
          $active={pathname.startsWith("/profile")}>
          <UserIcon />
        </IconLink>

        <IconLink
          {...makePointerPress(
            (isPressed) => setPressedTab(isPressed ? "support" : null),
            undefined
          )}
          $pressed={pressedTab === "support"}
          to="/support"
          $active={pathname.startsWith("/support")}
        >
          <ChatIcon />
        </IconLink>
      </Bar>
    </Wrap>
  );
}


/* ====== стили ====== */
const Wrap = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
  pointer-events: none;
  padding: 0 var(--side-pad, 16px);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
`;

const Bar = styled.nav`
  pointer-events: auto;
  border: 2px solid #f5b300;
  background: #f5b300;
  border-radius: 10px;
  width: min(98%, 770px);
  height: 64px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  align-items: center;
  justify-items: center;
  margin: 0 auto;
`;

const IconLink = styled(Link)`
  width: 75%;
  height: 80%;
  display: grid;
  place-items: center;
  border-radius: 12px;
  text-decoration: none;
  padding: 6px;
  box-sizing: border-box;
  background: ${(p) =>
    p.$active
      ? "linear-gradient(180deg, #906606 0%, #7b5a09 100%)"
      : "transparent"};
  box-shadow: ${(p) =>
    p.$active ? "inset 0 3px 8px rgba(0,0,0,0.35)" : "none"};

  img {
    width: 26px;
    height: 26px;
    display: block;
    opacity: ${(p) => (p.$active ? 1 : 0.95)};
    transition: transform 120ms ease, opacity 120ms ease;
    transform: ${(p) => (p.$pressed ? "scale(0.94)" : "scale(1)")};
  }

  /* можно вообще убрать &:active img, чтобы всё шло через $pressed */
  /* &:active img {
    transform: scale(0.94);
  } */
`;


const CartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
`;

/*
  Логика:
  - точка (50%, 50%) — это центр иконки корзины (она по центру ячейки)
  - дальше чуть двигаем вправо и вверх
  - так бейдж всегда "липнет" к верхнему правому углу иконки, а не контейнера
*/
const CartBadge = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(6px, -18px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #f5b300;
  border: 2px solid #fff;
  font-size: 9px;
  font-weight: 800;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

/* ====== иконки ====== */
function LogoIcon() {
  return (
    <img src="/assets/images/barLogo.svg" alt="logo" width={26} height={26} />
  );
}
function CartIcon() {
  return (
    <img src="/assets/images/barCart.svg" alt="cart" width={26} height={26} />
  );
}
function UserIcon() {
  return (
    <img src="/assets/images/barProfile.svg" alt="profile" width={26} height={26} />
  );
}
function ChatIcon() {
  return (
    <img src="/assets/images/barChat.svg" alt="chat" width={26} height={26} />
  );
}
function CatalogIcon() {
  return (
    <img src="/assets/images/barCatalog.svg" alt="catalog" width={26} height={26} />
  );
}
