import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { OrderTrafficData } from "../../../modules/dashboard/dashboard.types";

interface OrderTrafficHeatmapProps {
  data: OrderTrafficData;
}

export const OrderTrafficHeatmap: React.FC<OrderTrafficHeatmapProps> = ({
  data,
}) => {
  const getHeatmapOptions = (title: string) => ({
    chart: {
      type: "heatmap" as const,
      height: 350,
      toolbar: { show: true },
      animations: { enabled: true },
    },
    plotOptions: {
      heatmap: {
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 100, color: "#f0fdf4", name: "Very Low" },
            { from: 101, to: 500, color: "#dcfce7", name: "Low" },
            { from: 501, to: 1500, color: "#86efac", name: "Medium" },
            { from: 1501, to: 3000, color: "#4ade80", name: "High" },
            { from: 3001, to: 5000, color: "#22c55e", name: "Very High" },
            { from: 5001, to: 100000, color: "#15803d", name: "Highest" },
          ],
        },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data?.dayNames || [],
      labels: { style: { fontSize: "12px" }, rotate: -45 },
    },
    yaxis: {
      categories: data?.timeSlots || [],
      title: { text: "Time Slot" },
    },
    title: {
      text: title,
      align: "center" as const,
      style: { fontSize: "14px", fontWeight: "bold" },
    },
    tooltip: {
      y: { formatter: (val: number) => `৳${val.toFixed(0)}` },
    },
  });

  // সিরিজ বিল্ডার: প্রতিটি সিরিজ = একটি টাইম স্লট, x = দিন
  const buildHeatmapSeries = (items: any[]) => {
    const series: any[] = [];
    const dayNames = data?.dayNames || [];
    const timeSlots = data?.timeSlots || [];

    timeSlots.forEach((slot) => {
      const slotData = items.filter((d) => d.y === slot);
      const dayMap: Record<string, number> = {};
      slotData.forEach((d) => {
        dayMap[d.x] = d.value;
      });

      const values = dayNames.map((day) => ({
        x: day,
        y: dayMap[day] || 0,
      }));
      series.push({ name: slot, data: values });
    });

    return series;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
      >
        <Chart
          options={getHeatmapOptions("Website Orders")}
          series={buildHeatmapSeries(data?.website || [])}
          type="heatmap"
          height={350}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
      >
        <Chart
          options={getHeatmapOptions("Custom Orders")}
          series={buildHeatmapSeries(data?.custom || [])}
          type="heatmap"
          height={350}
        />
      </motion.div>
    </div>
  );
};
