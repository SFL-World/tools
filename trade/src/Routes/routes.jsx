import { Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
import NotFound from "../Pages/404.jsx";

export default function appRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
