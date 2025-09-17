import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  :root {
    --side-pad: 12px;
  }

  html, body {
    height: 100%;
    margin: 0;
    background: #000;
    color: #fff;
    font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;

    /* Главное — не прокидывать скролл наружу WebApp */
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
  }

  /* Корень приложения */
  #root {
    min-height: 100dvh;
    overflow-x: hidden;
    background: #000;
  }

  /* На всякий — делаем вертикальные жесты предсказуемыми */
  * {
    box-sizing: border-box;
    touch-action: pan-y;                 /* только вертикальный скролл */
    -webkit-tap-highlight-color: transparent;
  }

  /* Любые скролл-контейнеры держим в рамках, чтобы pull-to-close не срабатывал */
  main, .page, [data-page], [data-scroll] {
    overscroll-behavior-y: contain;      /* не отдаём инерцию наружу */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  img, video {
    display: block;
    max-width: 100%;
  }

  a { color: inherit; text-decoration: none; }
  button, input, textarea { font: inherit; color: inherit; background: transparent; }
`;

export default GlobalStyle;
