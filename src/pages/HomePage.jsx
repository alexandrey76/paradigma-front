import styled, { createGlobalStyle } from "styled-components";

const Global = createGlobalStyle`
  html, body, #root { height: 100%; }
  body { margin: 0; background:#0c0c0c; color:#fff; }
`;

const Box = styled.div`
  padding: 16px;
  min-height: 100vh;
`;

export default function HomePage() {
  return (
    <>
      <Global />
      <Box>Глобальные стили тоже ок</Box>
    </>
  );
}
