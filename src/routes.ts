import { createBrowserRouter } from "react-router";
import Login from "./modules/auth/Login";
import Category from "./modules/master-data/category/Category";
import App from "./App";
import { Product } from "./modules/product/Product";
import Components from "./components/ui/Components";


export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: App,
    children: [
      { path: "category", Component: Category },
      { path: "product", Component: Product },
      { path: "x", Component: Components },

    ],
  },
]);