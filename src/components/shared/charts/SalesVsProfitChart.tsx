import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { SalesVsProfitData } from "../../../modules/dashboard/dashboard.types";

interface SalesVsProfitChartProps {
  data: SalesVsProfitData[];
}

export const SalesVsProfitChart: React.FC<SalesVsProfitChartProps> = ({
  data,
}) => {
  const options = {
    chart: {
      type: "line" as const,
      zoom: { enabled: true },
      toolbar: { show: true },
      animations: { enabled: true },
    },
    stroke: { curve: "smooth" as const, width: 3 },
    colors: ["#3b82f6", "#10b981"],
    xaxis: {
      categories: data.map((d) => d.date),
      labels: { rotate: -45 },
    },
    yaxis: { title: { text: "Amount (TK)" } },
    tooltip: { y: { formatter: (val: number) => `৳${val.toFixed(2)}` } },
    title: {
      text: "Sales vs Profit (Daily)",
      align: "center" as const,
      style: { fontSize: "16px", fontWeight: "bold" },
    },
  };

  const series = [
    { name: "Revenue", data: data.map((d) => d.revenue) },
    { name: "Profit", data: data.map((d) => d.profit) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.3 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50 mb-5"
    >
      <Chart options={options} series={series} type="line" height={350} />
    </motion.div>
  );
};
