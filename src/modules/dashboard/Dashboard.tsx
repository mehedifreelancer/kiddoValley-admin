"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BestProductsChart } from "../../components/shared/charts/BestProductsChart";
import { CategorySalesChart } from "../../components/shared/charts/CategorySalesChart";
import { OrderStatusChart } from "../../components/shared/charts/OrderStatusChart";
import { OrderTrafficHeatmap } from "../../components/shared/charts/OrderTrafficHeatmap";
import { OverviewStats } from "../../components/shared/charts/OverviewStats";
import { PaymentStatusChart } from "../../components/shared/charts/PaymentStatusChart";
import { ProductSalesChart } from "../../components/shared/charts/ProductSalesChart";
import { RetentionChart } from "../../components/shared/charts/RetentionChart";
import { SalesTrendChart } from "../../components/shared/charts/SalesTrendChart";
import { SalesVsProfitChart } from "../../components/shared/charts/SalesVsProfitChart";
import { TopCustomersTable } from "../../components/shared/charts/TopCustomersTable";
import { TopProductsTable } from "../../components/shared/charts/TopProductsTable";
import Toolbar from "../../components/ui/Toolbar";

import {
  fetchBestProducts,
  fetchCategorySales,
  fetchOrderStatus,
  fetchOrderTraffic,
  fetchOverview,
  fetchPaymentStatus,
  fetchProductSales,
  fetchRetention,
  fetchSalesTrend,
  fetchSalesVsProfit,
  fetchTopCustomers,
  fetchTopProfitProducts,
} from "./dashboard.service";

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number | "today">("today");

  // Data states
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesVsProfit, setSalesVsProfit] = useState([]);
  const [retention, setRetention] = useState(null);
  const [payment, setPayment] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [profitProducts, setProfitProducts] = useState([]);
  const [orderTraffic, setOrderTraffic] = useState(null);

  const fetchAll = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        trendRes,
        productsRes,
        categoriesRes,
        productSalesRes,
        customersRes,
        salesVsProfitRes,
        retentionRes,
        paymentRes,
        orderRes,
        profitRes,
        trafficRes,
      ] = await Promise.all([
        fetchOverview(start, end),
        fetchSalesTrend(start, end),
        fetchBestProducts(start, end),
        fetchCategorySales(start, end),
        fetchProductSales(start, end),
        fetchTopCustomers(start, end),
        fetchSalesVsProfit(start, end),
        fetchRetention(start, end),
        fetchPaymentStatus(start, end),
        fetchOrderStatus(start, end),
        fetchTopProfitProducts(start, end),
        fetchOrderTraffic(start, end),
      ]);

      setOverview(overviewRes);
      setTrend(trendRes);
      setProducts(productsRes);
      setCategories(categoriesRes);
      setProductSales(productSalesRes);
      setCustomers(customersRes);
      setSalesVsProfit(salesVsProfitRes);
      setRetention(retentionRes);
      setPayment(paymentRes);
      setOrderStatuses(orderRes);
      setProfitProducts(profitRes);
      setOrderTraffic(trafficRes);
    } catch (err: any) {
      setError(err.message || "ডেটা লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const handleDaysClick = (d: number | "today") => {
    setDays(d);
    if (d === "today") {
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(today);
      fetchAll(today, today);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - d);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchAll(startStr, endStr);
    }
  };

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      setDays("today");
      fetchAll(startDate, endDate);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    handleDaysClick("today");
  };

  useEffect(() => {
    handleDaysClick("today");
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="text-lg">{error}</p>
        <button
          onClick={() => fetchAll(startDate || undefined, endDate || undefined)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-8">
      <div>
        <Toolbar title="Dashboard">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => handleDaysClick("today")}
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                  days === "today"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50"
                }`}
              >
                আজ
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              {[7, 30, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDaysClick(d)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    days === d
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {d === 7
                    ? "৭দিন"
                    : d === 30
                      ? "৩০দিন"
                      : d === 90
                        ? "৯০দিন"
                        : "১৮০দিন"}
                </button>
              ))}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-1 w-32"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-1 w-32"
              />
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
              >
                প্রয়োগ
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
              >
                রিসেট
              </button>
            </div>
          </div>
        </Toolbar>

        {/* 1. Overview Stats */}
        <OverviewStats data={overview} />

        {/* 2. Sales Trend + Best Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <SalesTrendChart data={trend} />
          <BestProductsChart data={products} />
        </div>

        {/* 3. Category Sales + Product Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <CategorySalesChart data={categories} />
          <ProductSalesChart data={productSales} />
        </div>

        {/* 4. Sales vs Profit */}
        <SalesVsProfitChart data={salesVsProfit} />

        {/* 5. Retention + Payment + Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <RetentionChart data={retention} />
          <PaymentStatusChart data={payment} />
          <OrderStatusChart data={orderStatuses} />
        </div>

        {/* 6. Order Traffic Heatmap */}
        <OrderTrafficHeatmap data={orderTraffic} />

        {/* 7. Top Products (Sold + Profit) */}
        <TopProductsTable soldData={products} profitData={profitProducts} />

        {/* 8. Top Customers */}
        <TopCustomersTable data={customers} />

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          শেষ হালনাগাদ: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
