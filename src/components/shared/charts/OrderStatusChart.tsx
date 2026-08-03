import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { OrderStatus } from "../../../modules/dashboard/dashboard.types";

interface OrderStatusChartProps {
  data: OrderStatus[];
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  const options = {
    chart: {
      type: "bar" as const,
      toolbar: { show: true },
    },
    colors: ["#8b5cf6"],
    xaxis: { categories: data.map((o) => o.orderStatus) },
    yaxis: { title: { text: "Orders" } },
    plotOptions: { bar: { horizontal: false, columnWidth: "60%" } },
    title: {
      text: "Order Status",
      align: "center" as const,
    },
    tooltip: { y: { formatter: (val: number) => `${val} orders` } },
  };

  const series = [{ name: "Orders", data: data.map((o) => o._count) }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <Chart options={options} series={series} type="bar" height={280} />
    </motion.div>
  );
};
