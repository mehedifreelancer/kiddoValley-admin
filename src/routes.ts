import { createBrowserRouter } from "react-router";
import App from "./App";
import Category from "./modules/master-data/category/Category";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: Category }, // optional default
      { path: "master-data/category", Component: Category },
    ],
  },
]);