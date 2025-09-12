import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* отрисовать по пустому хэшу */}
        <Route index element={<HomePage />} />
        {/* обычный / тоже на всякий */}
        <Route path="/" element={<HomePage />} />
        {/* любой другой путь — редирект на / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
