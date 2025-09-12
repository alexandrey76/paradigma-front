import { HashRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </HashRouter>
  );
}
