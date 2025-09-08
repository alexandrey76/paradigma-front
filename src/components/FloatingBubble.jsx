import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const LS_KEY = "bubble_hidden_until_v2";

function scrollToContact() {
  const el = document.getElementById("contact-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function FloatingBubble({
  delay = 10,          // показ через N мс
  ttlSeconds = 5,    // 👉 ВРЕМЕННО: TTL в секундах для отладки (если задан, используем его)
  onlyOn = null,        // например ["/","/catalog"], иначе на всех
}) {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const force = params.get("bubble") === "1"; // 👉 форс-показ

  const routeAllowed = useMemo(() => {
    if (!onlyOn) return true;
    return onlyOn.includes(location.pathname);
  }, [onlyOn, location.pathname]);

  useEffect(() => {
    // ЛОГИ — увидишь в консоли, что происходит
    console.log("[Bubble] path:", location.pathname, "force:", force, "allowed:", routeAllowed);

    if (!routeAllowed) return;

    if (force) {
      // форс-показ: игнорируем TTL, показываем сразу после delay
      const t = setTimeout(() => {
        console.log("[Bubble] force show");
        setVisible(true);
      }, delay);
      return () => clearTimeout(t);
    }

    const hiddenUntil = Number(localStorage.getItem(LS_KEY) || 0);
    if (Date.now() < hiddenUntil) {
      console.log("[Bubble] suppressed until", new Date(hiddenUntil).toLocaleTimeString());
      return;
    }

    const t = setTimeout(() => {
      console.log("[Bubble] show by delay");
      setVisible(true);
    }, delay);
    return () => clearTimeout(t);
  }, [delay, routeAllowed, force, location.pathname]);

  const hide = (remember = true) => {
    if (remember) {
      // если ttlSeconds задан — используем секунды, иначе старую схему не трогаем
      const ms = ttlSeconds != null ? Number(ttlSeconds) * 1000 : (24 * 3600 * 1000);
      const until = Date.now() + ms;
      localStorage.setItem(LS_KEY, String(until));
    }
    setVisible(false);
  };

  const handleClick = () => {
    if (location.pathname === "/") {
      scrollToContact();
      hide(false);
    } else {
      navigate("/?scroll=contact");
      hide(false);
    }
  };

  if (!visible || !routeAllowed) return null;

  return createPortal(
    <div style={styles.wrap}>
      <button onClick={() => hide(true)} style={styles.close} aria-label="Закрыть">×</button>
      <div style={styles.title}>Свяжитесь с менеджером</div>
      <div style={styles.text}>Ответим как можно скорее!</div>
      <button onClick={handleClick} style={styles.btn}>Связаться</button>
    </div>,
    document.body
  );
}

const styles = {
  wrap: {
    position: "fixed",
    left: 16, bottom: 16,
    zIndex: 9999,
    maxWidth: 320,
    background: "rgba(20,22,25,.98)",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    boxShadow: "0 10px 24px rgba(0,0,0,.28)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  title: { fontWeight: 700, marginBottom: 6 },
  text: { fontSize: 13, opacity: .9, marginBottom: 10 },
  btn: {
    background: "#2a9df4", color: "#fff",
    border: "none", borderRadius: 10,
    padding: "10px 14px", fontWeight: 700, cursor: "pointer",
  },
  close: {
    position: "absolute", right: 6, top: 4,
    width: 28, height: 28,
    border: "none", background: "transparent",
    color: "#bbb", fontSize: 20, cursor: "pointer",
  },
};
