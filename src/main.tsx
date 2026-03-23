import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import "./assets/css/calendar.css";
import "./assets/css/table.css";
import { router } from "./routes";


const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <RouterProvider router={router} />,
);
