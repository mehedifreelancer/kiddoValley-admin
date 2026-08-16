import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthGuard from "./components/guards/AuthGuard";
import Components from "./components/ui/Components";
import Asset from "./modules/accounts/assets/Asset";
import { Balance } from "./modules/accounts/Balanace";
import EmployeeBillManagement from "./modules/accounts/employee-bill/EmployeeBill";
import RawMaterialManagement from "./modules/accounts/raw-material/RawMaterial";
import TransactionCategoryList from "./modules/accounts/transaction-category/TransactionCategory";
import SignIn from "./modules/auth/SignIn";
import CustomerList from "./modules/customer/Customer";
import {
  default as Dashboard,
  default as Report,
} from "./modules/dashboard/Dashboard";
import Slider from "./modules/hero-banner-slider/HeroBannerSlider";
import HeroSliderManagement from "./modules/hero-slider/HeroSliderManagement";
import LiveCampaign from "./modules/live-campaign/LiveCampaign";
import Category from "./modules/master-data/category/Category";
import EditOrder from "./modules/order/EditOrder"; // ✅ নতুন
import Order from "./modules/order/order";
import OrderList from "./modules/order/OrderList";
import { Product } from "./modules/product/Product";
import AnnualReport from "./modules/reports/annual-reports/AnnualReport";
import SellsReport from "./modules/reports/SellsReport";
import StockIn from "./modules/stock-in/StockIn";
import Stock from "./modules/stock/stock";
import SupplierList from "./modules/supplier/supplier";
import DeliverySettingsPage from "./modules/web-settings/delivery-settings/deliverySettings";
import PackagingSettings from "./modules/web-settings/packaging-settings/PackagingSettings";
import { WebSettings } from "./modules/web-settings/WebSettings";

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
      {
        path: "account",
        children: [
          {
            path: "transaction-categories",
            element: <TransactionCategoryList />,
          },
          { path: "balance", element: <Balance /> },
          { path: "asset", element: <Asset /> },
          { path: "employee-bill", element: <EmployeeBillManagement /> },
          { path: "raw-material", element: <RawMaterialManagement /> },
        ],
      },

      {
        path: "report",
        children: [
          { path: "sells-report", element: <SellsReport /> },
          { path: "annual-report", element: <AnnualReport /> },
        ],
      },
      { path: "customer", element: <CustomerList /> },
      { path: "supplier", element: <SupplierList /> },
      { path: "stock", element: <Stock /> },
      { path: "stock-in", element: <StockIn /> },
      { path: "create-order", element: <Order /> },
      { path: "order-list", element: <OrderList /> },
      { path: "order-edit/:id", element: <EditOrder /> }, // ✅ নতুন রুট
      { path: "purchase", element: <Purchase /> },
      { path: "report", element: <Report /> },
      { path: "live-campaign", element: <LiveCampaign /> },
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
          { path: "delivery-settings", element: <DeliverySettingsPage /> },
          { path: "packaging-settings", element: <PackagingSettings /> },
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
