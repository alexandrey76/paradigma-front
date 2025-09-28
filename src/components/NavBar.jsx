import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";

export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <Wrap>
      <Bar role="navigation" aria-label="Нижняя навигация">
        <IconLink to="/" >
          <img
            src={pathname === "/" 
              ? "/assets/images/barLogoActive.svg" 
              : "/assets/images/barLogo.svg"}
            alt="logo"
          />
        </IconLink>

        <IconLink to="/catalog">
          <img
            src={pathname.startsWith("/catalog") 
              ? "/assets/images/barCatalogActive.svg" 
              : "/assets/images/barCatalog.svg"}
            alt="catalog"
          />
        </IconLink>

        <IconLink to="/cart">
          <img
            src={pathname.startsWith("/cart") 
              ? "/assets/images/barCartActive.svg" 
              : "/assets/images/barCart.svg"}
            alt="cart"
          />
        </IconLink>

        <IconLink to="/profile">
          <img
            src={pathname.startsWith("/profile") 
              ? "/assets/images/barProfileActive.svg" 
              : "/assets/images/barProfile.svg"}
            alt="profile"
          />
        </IconLink>

        <IconLink to="/support">
          <img
            src={pathname.startsWith("/support") 
              ? "/assets/images/barSupportActive.svg" 
              : "/assets/images/barSupport.svg"}
            alt="support"
          />
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

  /* убираем все паддинги */
  padding: 0;
  margin: 0;

  display: flex;
  justify-content: center;

  /* если нужно учитывать вырезы на iOS */
  background: black; /* временно, чтобы проверить */
`;

const Bar = styled.div`
  width: 100%;
  max-width: 560px;
  height: calc(56px + env(safe-area-inset-bottom)); /* бар растягивается */
  padding-bottom: env(safe-area-inset-bottom);      /* иконки не упираются в вырез */

  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
  justify-items: stretch;
`;



const IconLink = styled(Link)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* сохраняем пропорции SVG */
  }
`;
