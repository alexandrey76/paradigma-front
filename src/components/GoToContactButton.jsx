import { useLocation, useNavigate } from "react-router-dom";
import { scrollToContact } from "../pages/HomePage";

export default function GoToContactButton({ children = "Связаться", ...rest }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (location.pathname === "/") {
      // уже на главной — просто скроллим
      scrollToContact();
    } else {
      // с других страниц — переходим на главную с маркером
      navigate("/?scroll=contact");
    }
  };

  return (
    <button onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}
