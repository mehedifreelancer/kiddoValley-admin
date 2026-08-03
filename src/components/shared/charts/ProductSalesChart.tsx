import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { ProductSale } from "../../../modules/dashboard/dashboard.types";

interface ProductSalesChartProps {
  data: ProductSale[];
}

export const ProductSalesChart: React.FC<ProductSalesChartProps> = ({
  data,
}) => {
  const options = {
    chart: { type: "donut" as const },
    labels: data.map((p) => p.name),
    colors: ["#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6366f1"],
    legend: { position: "bottom" as const },
    title: {
      text: "Product Wise Sales",
      align: "center" as const,
    },
    tooltip: { y: { formatter: (val: number) => `৳${val.toFixed(2)}` } },
  };

  const series = data.map((p) => p.value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="donut" height={300} />
    </motion.div>
  );
};
