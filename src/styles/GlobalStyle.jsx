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
  }

  body {
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI",
                 Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden; /* защищаем от горизонтального скролла */
  }

  #root {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
`;