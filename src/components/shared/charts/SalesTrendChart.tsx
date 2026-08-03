import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { SalesTrend } from "../../../modules/dashboard/dashboard.types";

interface SalesTrendChartProps {
  data: SalesTrend[];
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  const options = {
    chart: {
      type: "line" as const,
      zoom: { enabled: true },
      toolbar: { show: true },
      animations: { enabled: true },
    },
    stroke: { curve: "smooth" as const, width: 3 },
    colors: ["#6366f1"],
    xaxis: {
      categories: data.map((d) => d.date),
      labels: { rotate: -45 },
    },
    yaxis: { title: { text: "Revenue (TK)" } },
    tooltip: { y: { formatter: (val: number) => `৳${val.toFixed(2)}` } },
    title: {
      text: "Sales Trend",
      align: "center" as const,
      style: { fontSize: "16px", fontWeight: "bold" },
    },
  };

  const series = [{ name: "Revenue", data: data.map((d) => d.total) }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="line" height={300} />
    </motion.div>
  );
};
