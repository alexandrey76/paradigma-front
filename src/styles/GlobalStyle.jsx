// src/styles/GlobalStyle.jsx
import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    min-height: 100%;
    background: #000;
    color: #fff;
    margin: 0;
    padding: 0;
    scroll-behavior: smooth; /* можно убрать, если не хочешь плавный скролл */

    /* ВАЖНО: запрет зума жестами */
    touch-action: pan-x pan-y;       /* отключает pinch-zoom, оставляет скролл */
    -ms-content-zooming: none;       /* IE/Edge Legacy */
    overscroll-behavior: none;       /* убирает резкие bounce-эффекты */
    -webkit-text-size-adjust: 100%;  /* не увеличивать шрифт при landscape на iOS */
  }

  body {
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI",
                 Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden; /* защищаем от горизонтального скролла */
    user-select: none;  /* опционально: запрет выделения, чтоб не вызывало зум/лупу */
  }

  /* Разрешим выделение в полях ввода, иначе неудобно */
  input, textarea {
    user-select: text;
    -webkit-user-select: text;
  }

  #root {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
`;
