// src/styles/GlobalStyle.jsx
import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  *, *::before, *::after { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0; /* Убедитесь, что нет padding */
    background: #000;
    color: #fff;
    overflow-x: hidden; /* Предотвращает горизонтальный скролл */
  }

  html { 
    -webkit-text-size-adjust: 100%; 
    text-size-adjust: 100%; 
  }

  body {
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI",
                 Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
  }

  img, video { 
    display: block; 
    max-width: 100%; 
  }

  button, input, textarea, select {
    font: inherit; 
    color: inherit; 
    background: none; 
    border: 0;
    -webkit-appearance: none; 
    appearance: none;
  }

  :root { 
    --side-pad: 16px; 
    --navbar-height: 64px; /* универсальная высота NavBar */
  }

  /* Полная высота экрана для контента */
  .fullScreen { 
    min-height: 100svh; 
    height: 100svh;
  }

  .minFullHeight { 
    min-height: 100svh; 
  }
`;
