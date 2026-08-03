import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { RetentionData } from "../../../modules/dashboard/dashboard.types";

interface RetentionChartProps {
  data: RetentionData;
}

export const RetentionChart: React.FC<RetentionChartProps> = ({ data }) => {
  const options = {
    chart: { type: "pie" as const },
    labels: ["New Customers", "Returning Customers"],
    colors: ["#10b981", "#6366f1"],
    legend: { position: "bottom" as const },
    title: {
      text: "New vs Returning Customers",
      align: "center" as const,
    },
    tooltip: { y: { formatter: (val: number) => `${val} customers` } },
  };

  const series = [data?.new?.count || 0, data?.returning?.count || 0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.7 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="pie" height={280} />
      <div className="flex justify-center gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">
            ৳{data?.new?.spent?.toFixed(2) || 0}
          </span>{" "}
          (New)
        </div>
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">
            ৳{data?.returning?.spent?.toFixed(2) || 0}
          </span>{" "}
          (Returning)
        </div>
      </div>
    </motion.div>
  );
};
