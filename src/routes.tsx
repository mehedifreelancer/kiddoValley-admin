// router.tsx
import { createBrowserRouter } from "react-router-dom";
import Category from "./modules/master-data/category/Category";
import AuthGuard from "./components/guards/AuthGuard";
import App from "./App";
import { Product } from "./modules/product/Product";
import Components from "./components/ui/Components";
import SignIn from "./modules/auth/SignIn";
import Dashboard from "./modules/dashboard/dashboard";

// Placeholder components for missing routes
const Customer = () => <div>Customer Page</div>;
const Supplier = () => <div>Supplier Page</div>;
const Stock = () => <div>Stock Page</div>;
const Sells = () => <div>Sells Page</div>;
const Purchase = () => <div>Purchase Page</div>;
const UploadLogo = () => <div>Upload Logo Page</div>;
const SocialLinks = () => <div>Social Media Links Page</div>;
const Report = () => <div>Report Page</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "customer", element: <Customer /> },
      { path: "supplier", element: <Supplier /> },
      { path: "stock", element: <Stock /> },
      { path: "sells", element: <Sells /> },
      { path: "purchase", element: <Purchase /> },
      { path: "report", element: <Report /> },
      {
        path: "products",
        children: [
          { path: "category", element: <Category /> },
          { path: "product", element: <Product /> },
          { path: "x", element: <Components /> },
        ],
      },
      {
        path: "web-settings",
        children: [
          { path: "upload-logo", element: <UploadLogo /> },
          { path: "social-links", element: <SocialLinks /> },
        ],
      },
    ],
  },
  {
    path: "/sign-in",
    element: (
      <AuthGuard>
        <SignIn />
      </AuthGuard>
    ),
  },
]);
