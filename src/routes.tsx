import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthGuard from "./components/guards/AuthGuard";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
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
import FormulaManagement from "./modules/formula/Formula";
import Slider from "./modules/hero-banner-slider/HeroBannerSlider";
import HeroSliderManagement from "./modules/hero-slider/HeroSliderManagement";
import LiveCampaign from "./modules/live-campaign/LiveCampaign";
import Category from "./modules/master-data/category/Category";
import EditOrder from "./modules/order/EditOrder";
import Order from "./modules/order/order";
import OrderList from "./modules/order/OrderList";
import { Product } from "./modules/product/Product";
import AnnualReport from "./modules/reports/annual-reports/AnnualReport";
import SellsReport from "./modules/reports/SellsReport";
import StockIn from "./modules/stock-in/StockIn";
import Stock from "./modules/stock/stock";
import SupplierList from "./modules/supplier/supplier";
import NotFound from "./modules/unauthorized/NotFound";
import Unauthorized from "./modules/unauthorized/Unauthorized";
import UserManagement from "./modules/users/user";
import DeliverySettingsPage from "./modules/web-settings/delivery-settings/deliverySettings";
import GridManagement from "./modules/web-settings/layout-settings/GridManagement";
import PackagingSettings from "./modules/web-settings/packaging-settings/PackagingSettings";
import { WebSettings } from "./modules/web-settings/WebSettings";
import DailyReport from "./modules/reports/daily-report/DailyReport";
import Worksheet from "./modules/worksheet/Worksheet";

// Placeholder for UserManagement (if not created yet)
// import UserManagement from "./modules/users/User";

// Placeholder for other missing components
const Purchase = () => <div>Purchase Page</div>;

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

      // ===== Accounts =====
      {
        path: "account",
        children: [
          {
            path: "transaction-categories",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <TransactionCategoryList />
              </ProtectedRoute>
            ),
          },
          {
            path: "balance",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <Balance />
              </ProtectedRoute>
            ),
          },
          {
            path: "asset",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <Asset />
              </ProtectedRoute>
            ),
          },
          {
            path: "employee-bill",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <EmployeeBillManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "raw-material",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <RawMaterialManagement />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ===== Reports =====
      {
        path: "report",
        children: [
          {
            path: "sells-report",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <SellsReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "annual-report",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <AnnualReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "daily-report",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <DailyReport />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ===== Other Modules =====
      {
        path: "customer",
        element: (
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "data_accountant",
              "moderator",
            ]}
          >
            <CustomerList />
          </ProtectedRoute>
        ),
      },
      {
        path: "supplier",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <SupplierList />
          </ProtectedRoute>
        ),
      },
      {
        path: "stock",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <Stock />
          </ProtectedRoute>
        ),
      },
      {
        path: "stock-in",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <StockIn />
          </ProtectedRoute>
        ),
      },
      {
        path: "create-order",
        element: (
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "data_accountant",
              "moderator",
            ]}
          >
            <Order />
          </ProtectedRoute>
        ),
      },
      {
        path: "order-list",
        element: (
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "data_accountant",
              "moderator",
            ]}
          >
            <OrderList />
          </ProtectedRoute>
        ),
      },
      {
        path: "order-edit/:id",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <EditOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "purchase",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <Purchase />
          </ProtectedRoute>
        ),
      },
      {
        path: "report",
        element: (
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "data_accountant",
              "moderator",
            ]}
          >
            <Report />
          </ProtectedRoute>
        ),
      },
      {
        path: "live-campaign",
        element: (
          <ProtectedRoute allowedRoles={["super_admin", "admin", "moderator"]}>
            <LiveCampaign />
          </ProtectedRoute>
        ),
      },

      // ===== Products =====
      {
        path: "products",
        children: [
          {
            path: "category",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <Category />
              </ProtectedRoute>
            ),
          },
          {
            path: "product-list",
            element: (
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "data_accountant"]}
              >
                <Product />
              </ProtectedRoute>
            ),
          },
          { path: "x", element: <Components /> },
        ],
      },

      // ===== Web Settings =====
      {
        path: "web-settings",
        children: [
          {
            path: "logo-&-social",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <WebSettings />
              </ProtectedRoute>
            ),
          },
          {
            path: "slider",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <Slider />
              </ProtectedRoute>
            ),
          },
          {
            path: "hero-slider",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <HeroSliderManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "delivery-settings",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <DeliverySettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "packaging-settings",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <PackagingSettings />
              </ProtectedRoute>
            ),
          },
          {
            path: "layout-settings",
            element: (
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <GridManagement />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ===== Users (Role Management) =====

      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "formulas",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <FormulaManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "worksheets",
        element: (
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "data_accountant"]}
          >
            <Worksheet />
          </ProtectedRoute>
        ),
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
  // ✅ নতুন Unauthorized রাউট (পাবলিক – AuthGuard ছাড়া)
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
