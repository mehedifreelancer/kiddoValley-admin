import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthGuard from "./components/guards/AuthGuard";
import Components from "./components/ui/Components";
import SignIn from "./modules/auth/SignIn";
import CustomerList from "./modules/customer/Customer";
import Dashboard from "./modules/dashboard/Dashboard";
import Slider from "./modules/hero-banner-slider/HeroBannerSlider";
import HeroSliderManagement from "./modules/hero-slider/HeroSliderManagement";
import Category from "./modules/master-data/category/Category";
import EditOrder from "./modules/order/EditOrder"; // ✅ নতুন
import Order from "./modules/order/order";
import OrderList from "./modules/order/OrderList";
import { Product } from "./modules/product/Product";
import StockIn from "./modules/stock-in/StockIn";
import Stock from "./modules/stock/stock";
import SupplierList from "./modules/supplier/supplier";
import { WebSettings } from "./modules/web-settings/WebSettings";
import Report from "./modules/dashboard/Dashboard";

// Placeholder components for missing routes
const Sells = () => <div>Sells Page</div>;
const Purchase = () => <div>Purchase Page</div>;
const UploadLogo = () => <div>Upload Logo Page</div>;
const SocialLinks = () => <div>Social Media Links Page</div>;

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
      { path: "customer", element: <CustomerList /> },
      { path: "supplier", element: <SupplierList /> },
      { path: "stock", element: <Stock /> },
      { path: "stock-in", element: <StockIn /> },
      { path: "create-order", element: <Order /> },
      { path: "order-list", element: <OrderList /> },
      { path: "order-edit/:id", element: <EditOrder /> }, // ✅ নতুন রুট
      { path: "purchase", element: <Purchase /> },
      { path: "report", element: <Report /> },
      {
        path: "products",
        children: [
          { path: "category", element: <Category /> },
          { path: "product-list", element: <Product /> },
          { path: "x", element: <Components /> },
        ],
      },
      {
        path: "web-settings",
        children: [
          { path: "logo-&-social", element: <WebSettings /> },
          { path: "slider", element: <Slider /> },
          { path: "hero-slider", element: <HeroSliderManagement /> },
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
