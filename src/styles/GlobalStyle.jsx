import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  /* базовые переменные (подгоняй при желании) */
  :root {
    --side-pad: 12px;
  }

  /* убираем прокидывание скролла за пределы веб-аппы */
  html, body {
    height: 100%;
    margin: 0;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
    background: #000;
    color: #fff;
    font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;
  }

  /* корневой контейнер приложения занимает всю видимую высоту */
  #root {
    min-height: 100dvh;
    overflow-x: hidden;
    background: #000;
  }

  /* аккуратные тач-жесты: только вертикальный скролл контента */
  * {
    box-sizing: border-box;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
  }

  img, video {
    display: block;
    max-width: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, textarea {
    font: inherit;
    color: inherit;
    background: transparent;
  }
`;

export default GlobalStyle;
