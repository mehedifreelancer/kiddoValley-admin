import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { BestProduct } from "../../../modules/dashboard/dashboard.types";

interface BestProductsChartProps {
  data: BestProduct[];
}

export const BestProductsChart: React.FC<BestProductsChartProps> = ({
  data,
}) => {
  const options = {
    chart: {
      type: "bar" as const,
      toolbar: { show: true },
    },
    colors: ["#8b5cf6", "#ec4899"],
    xaxis: {
      categories: data.map((p) => p.name),
      labels: { rotate: -45 },
    },
    yaxis: { title: { text: "Quantity Sold" } },
    plotOptions: { bar: { horizontal: false, columnWidth: "60%" } },
    tooltip: { y: { formatter: (val: number) => `${val} units` } },
    title: {
      text: "Best Selling Products",
      align: "center" as const,
    },
  };

  const series = [{ name: "Quantity", data: data.map((p) => p.quantity) }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="bar" height={300} />
    </motion.div>
  );
};
