// components/shared/charts/TopDefectProducts.tsx
import { ApexOptions } from "apexcharts";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Chart from "react-apexcharts";

interface TopDefectProduct {
  productName: string;
  defectRefundCount: number;
  totalSoldQuantity: number;
  defectPercentage: number;
}

interface TopDefectProductsProps {
  data: TopDefectProduct[];
}

export const TopDefectProducts: React.FC<TopDefectProductsProps> = ({
  data,
}) => {
  useEffect(() => {
    console.log("🔍 TopDefectProducts received data:", data);
  }, [data]);

  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          🔴 Top Defect-Intensive Products
        </h3>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <span>No defect refunds found</span>
        </div>
      </div>
    );
  }

  // ডোনাট চার্টের জন্য ডেটা প্রস্তুত
  const labels = safeData.map((item) => item.productName);
  const series = safeData.map((item) => item.defectPercentage);

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      animations: { enabled: true },
      background: "transparent",
    },
    labels: labels,
    colors: [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ],
    legend: {
      position: "bottom",
      labels: {
        colors: "#6b7280",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "12px",
        fontWeight: 600,
        colors: ["#1f2937"],
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}% refund rate`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: {
              fontSize: "14px",
              fontWeight: 600,
            },
            value: {
              fontSize: "16px",
              fontWeight: 700,
              formatter: (val: string) => `${val}%`,
            },
            total: {
              show: true,
              label: "Total",
              formatter: () =>
                `${series.reduce((a, b) => a + b, 0).toFixed(1)}%`,
            },
          },
        },
      },
    },
    theme: {
      mode: "light",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
        🔴 Top Defect-Intensive Products
      </h3>

      <Chart
        options={chartOptions}
        series={series}
        type="donut"
        height={300}
        width="100%"
      />
    </motion.div>
  );
};
