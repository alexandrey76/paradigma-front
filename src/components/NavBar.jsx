// src/components/NavBar.jsx
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";

export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <Wrap>
      <Bar role="navigation" aria-label="Нижняя навигация">
        <IconLink to="/" $active={pathname === "/"}>
          <LogoIcon />
        </IconLink>

        <IconLink to="/catalog" $active={pathname.startsWith("/catalog")}>
          <CatalogIcon />
        </IconLink>

        <IconLink to="/cart" $active={pathname.startsWith("/cart")}>
          <CartIcon />
        </IconLink>

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
  z-index: 50;

  /* отступ снизу с учётом выреза */
  padding: 20px 10px calc(20px + env(safe-area-inset-bottom));

  display: flex;
  justify-content: center;
  pointer-events: none; /* чтобы клики шли только на кнопки */
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
