// src/styles/GlobalStyle.js
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Montserrat', sans-serif;
    background: #000;
    color: #fff;
  }

  button, input, textarea {
    font-family: inherit;
  }
`;

export default GlobalStyle;
