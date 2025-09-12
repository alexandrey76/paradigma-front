import styled from "styled-components";

const Box = styled.div`
  background: #111;
  color: #0f0;
  padding: 16px;
  min-height: 100vh;
`;

export default function HomePage() {
  return <Box>Я виден. Это HomePage со styled-components.</Box>;
}
