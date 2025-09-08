// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  const navStyle = {
    display: "flex",
    gap: "20px",
    padding: "15px",
    backgroundColor: "#111",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  };

  const linkHover = {
    textDecoration: "underline",
  };

  return (
    <nav style={navStyle}>
      <Link className="navbar-link" to="/" style={linkStyle}>
        Главная
      </Link>
      <Link className="navbar-link" to="/catalog" style={linkStyle}>
        Каталог
      </Link>
      <Link className="navbar-link" to="/cart" style={linkStyle}>
        Корзина
      </Link>
    </nav>
  );
}
