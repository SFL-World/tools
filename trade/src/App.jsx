import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes/routes";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}
