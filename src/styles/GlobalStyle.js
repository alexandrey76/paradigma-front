import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    background: #000;           /* ← чёрный фон везде */
    color: #fff;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overscroll-behavior: none;
  }
  img { display:block; max-width:100%; }
  :root { --side-pad: clamp(12px, 3vw, 24px); }
`;
export default GlobalStyle;
