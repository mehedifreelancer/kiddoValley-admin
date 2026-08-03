import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { CategorySale } from "../../../modules/dashboard/dashboard.types";

interface CategorySalesChartProps {
  data: CategorySale[];
}

export const CategorySalesChart: React.FC<CategorySalesChartProps> = ({
  data,
}) => {
  const options = {
    chart: { type: "donut" as const },
    labels: data.map((c) => c.name),
    colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
    legend: { position: "bottom" as const },
    title: {
      text: "Category Wise Sales",
      align: "center" as const,
    },
    tooltip: { y: { formatter: (val: number) => `৳${val.toFixed(2)}` } },
  };

  const series = data.map((c) => c.value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="donut" height={300} />
    </motion.div>
  );
};
