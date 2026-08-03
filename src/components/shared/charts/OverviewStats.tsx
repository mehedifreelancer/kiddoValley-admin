import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  Gift,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { OverviewData } from "../../../modules/dashboard/dashboard.types";

interface OverviewStatsProps {
  data: OverviewData;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ data }) => {
  const stats = [
    {
      label: "মোট অর্ডার",
      value: data?.totalOrders || 0,
      icon: ShoppingBag,
      color: "from-indigo-500 to-purple-500",
    },
    {
      label: "মোট বিক্রয়",
      value: `৳${(data?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "মোট লাভ",
      value: `৳${(data?.totalProfit || 0).toFixed(2)}`,
      icon: Gift,
      color: "from-yellow-500 to-amber-500",
    },
    {
      label: "মোট পণ্য বিক্রয়",
      value: data?.totalProductsSold || 0,
      icon: Package,
      color: "from-teal-500 to-cyan-500",
    },
    {
      label: "গড় অর্ডার ভ্যালু",
      value: `৳${(data?.avgOrderValue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "from-rose-500 to-pink-500",
    },
    {
      label: "গড় লাভ",
      value: `৳${(data?.avgProfit || 0).toFixed(2)}`,
      icon: BarChart3,
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4"
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                {stat.label}
              </p>
              <p className="text-sm md:text-lg font-bold text-gray-800 dark:text-white mt-1">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-2 rounded-full bg-gradient-to-br ${stat.color} text-white shadow-sm`}
            >
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};
