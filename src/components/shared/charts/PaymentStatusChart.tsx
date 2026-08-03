import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { PaymentStatus } from "../../../modules/dashboard/dashboard.types";

interface PaymentStatusChartProps {
  data: PaymentStatus[];
}

export const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({
  data,
}) => {
  const options = {
    chart: { type: "donut" as const },
    labels: data.map((p) => p.paymentStatus),
    colors: ["#10b981", "#ef4444", "#6366f1"],
    legend: { position: "bottom" as const },
    title: { text: "Payment Status", align: "center" as const },
    tooltip: { y: { formatter: (val: number) => `${val} orders` } },
  };

  const series = data.map((p) => p._count);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="donut" height={280} />
    </motion.div>
  );
};
