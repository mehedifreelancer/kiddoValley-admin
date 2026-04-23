// modules/dashboard/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Calendar,
  MoreHorizontal,
  Trophy,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      title: "Today's Sell",
      value: "$12,426",
      change: "+8.2%",
      isPositive: true,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Monthly Sell",
      value: "$128,943",
      change: "+15.3%",
      isPositive: true,
      icon: <TrendingUp className="w-5 h-5" />,
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Yearly Sell",
      value: "$1,284,567",
      change: "+22.7%",
      isPositive: true,
      icon: <ShoppingBag className="w-5 h-5" />,
      color:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
      title: "In Stock",
      value: "8,942",
      change: "-3.1%",
      isPositive: false,
      icon: <Package className="w-5 h-5" />,
      color:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    },
  ];

  const lineChartOptions = {
    chart: {
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
    },
    colors: ["#3b82f6"],
    stroke: { curve: "smooth" as const, width: 3 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      labels: { style: { colors: "#64748b" } },
      axisBorder: { color: "#e2e8f0" },
      axisTicks: { color: "#e2e8f0" },
    },
    yaxis: {
      title: { text: "Quantity Sold", style: { color: "#64748b" } },
      labels: { style: { colors: "#64748b" } },
    },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 5 },
    tooltip: { theme: "dark" },
  };

  const lineChartSeries = [
    {
      name: "Sold Quantity",
      data: [
        1250, 1890, 2100, 2450, 2890, 3420, 3980, 4210, 4560, 4890, 5210, 5890,
      ],
    },
  ];

  const topBooksSold = [
    {
      id: 1,
      name: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      sold: 1245,
      revenue: "$24,900",
      cover: "📚",
    },
    {
      id: 2,
      name: "To Kill a Mockingbird",
      author: "Harper Lee",
      sold: 1120,
      revenue: "$22,400",
      cover: "📖",
    },
    {
      id: 3,
      name: "1984",
      author: "George Orwell",
      sold: 987,
      revenue: "$19,740",
      cover: "📕",
    },
    {
      id: 4,
      name: "Pride and Prejudice",
      author: "Jane Austen",
      sold: 876,
      revenue: "$17,520",
      cover: "📗",
    },
    {
      id: 5,
      name: "The Catcher in the Rye",
      author: "J.D. Salinger",
      sold: 765,
      revenue: "$15,300",
      cover: "📘",
    },
  ];

  const topBooksProfit = [
    {
      id: 1,
      name: "The Great Gatsby",
      profit: "$18,675",
      margin: "75%",
      sold: 1245,
    },
    { id: 2, name: "1984", profit: "$15,792", margin: "80%", sold: 987 },
    {
      id: 3,
      name: "To Kill a Mockingbird",
      profit: "$14,560",
      margin: "65%",
      sold: 1120,
    },
    {
      id: 4,
      name: "Pride and Prejudice",
      profit: "$12,264",
      margin: "70%",
      sold: 876,
    },
    {
      id: 5,
      name: "The Catcher in the Rye",
      profit: "$10,710",
      margin: "70%",
      sold: 765,
    },
  ];

  const topClients = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      purchases: 45,
      totalSpent: "$3,450",
      avatar: "JD",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      purchases: 38,
      totalSpent: "$2,890",
      avatar: "JS",
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert@example.com",
      purchases: 32,
      totalSpent: "$2,450",
      avatar: "RJ",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      purchases: 28,
      totalSpent: "$2,120",
      avatar: "ED",
    },
    {
      id: 5,
      name: "Michael Brown",
      email: "michael@example.com",
      purchases: 25,
      totalSpent: "$1,890",
      avatar: "MB",
    },
  ];

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className=" space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's your sales overview
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" /> View Report
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range:
            </span>
          </div>
          <div className="flex gap-2">
            {["today", "weekly", "monthly", "yearly"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${dateRange === range ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                {range}
              </button>
            ))}
            <button
              onClick={() => setDateRange("custom")}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${dateRange === "custom" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
            >
              Custom
            </button>
          </div>
          {dateRange === "custom" && (
            <div className="flex gap-3">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <button className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {stat.isPositive ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stat.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Sold Quantity Trend
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monthly sales quantity overview
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <Chart
          options={lineChartOptions}
          series={lineChartSeries}
          type="line"
          height={350}
        />
      </div>

      {/* Top Books Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Books Sold */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Top Books Sold
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Best selling books this period
                </p>
              </div>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topBooksSold.map((book, index) => (
              <div
                key={book.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center text-2xl">
                    {book.cover}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {book.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {book.author}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {book.sold}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {book.revenue}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      revenue
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Books by Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Top Books by Profit
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Most profitable books
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topBooksProfit.map((book, index) => (
              <div
                key={book.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {book.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Sold: {book.sold}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                        {book.margin} margin
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {book.profit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      profit
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Top Purchased Clients
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Most valuable customers
              </p>
            </div>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Purchases
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {topClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {client.avatar}
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {client.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {client.purchases}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {client.totalSpent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
