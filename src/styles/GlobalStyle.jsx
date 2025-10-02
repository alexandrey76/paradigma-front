// src/styles/GlobalStyle.jsx
import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  *, *::before, *::after { 
    box-sizing: border-box; 
  }

  html, body, #root {
    height: 100%;        /* фиксируем высоту корня */
    margin: 0;
    background: #000;
    color: #fff;
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
