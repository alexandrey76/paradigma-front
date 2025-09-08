import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// универсальная функция
export function scrollToContact() {
  const el = document.getElementById("contact-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  const [params] = useSearchParams();

  // если пришли с ?scroll=contact — скроллим автоматически
  useEffect(() => {
    if (params.get("scroll") === "contact") {
      const t = setTimeout(scrollToContact, 120); // дать разметке отрендериться
      return () => clearTimeout(t);
    }
  }, [params]);

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      {/* Hero / шапка */}
      <section style={{ padding: "24px 0" }}>
        <h1 style={{ marginBottom: 8 }}>Главная</h1>
        <p style={{ opacity: .8 }}>
          лол
        </p>
      </section>

      {/* Любой контент… */}
      <section style={{ height: 400, background: "#f6f7f9", borderRadius: 12, margin: "24px 0",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
        тип витрина
      </section>

      {/* СЕКЦИЯ С ФОРМОЙ (якорь!) */}
      <section id="contact-form" style={{ padding: "24px 0" }}>
        <h2 style={{ marginBottom: 12 }}>Остались вопросы?</h2>

        <form
          style={{
            display: "grid",
            gap: 12,
            maxWidth: 420,
            background: "#0f0f10",
            color: "#fff",
            padding: 16,
            borderRadius: 16
          }}
          onSubmit={(e) => {
            e.preventDefault();
            // сюда добавишь отправку (в бот/бэк)
            alert("Заявка отправлена");
          }}
        >
          {/* страна/телефон для полноты (упростим ввод) */}
          <input
            type="tel"
            placeholder="контакт для связи"
            style={inputStyle}
            required
            inputMode="tel"
            pattern="^\+?[0-9\s\-\(\)]{7,}$"
            title="Только цифры, пробелы, +, -, ( )"
          />
          <textarea
            placeholder="оаоаоаоао"
            style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
            required
          />
          <button type="submit" style={btnStyle}>Отправить</button>
        </form>
      </section>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #2d2f33",
  background: "#141517",
  color: "#fff",
  outline: "none",
};

const btnStyle = {
  background: "#2a9df4",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
