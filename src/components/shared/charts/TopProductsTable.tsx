import { motion } from "framer-motion";
import { BestProduct, TopProfitProduct } from "../../../modules/dashboard/dashboard.types";

interface TopProductsTableProps {
  soldData: BestProduct[];
  profitData: TopProfitProduct[];
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({
  soldData,
  profitData,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
      >
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span className="text-yellow-500">🏆</span> শীর্ষ ১০ বিক্রিত পণ্য
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">#</th>
                <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">পণ্যের নাম</th>
                <th className="text-center p-1.5 text-gray-500 dark:text-gray-400 font-medium">বিক্রি (টি)</th>
                <th className="text-right p-1.5 text-gray-500 dark:text-gray-400 font-medium">রাজস্ব (৳)</th>
              </tr>
            </thead>
            <tbody>
              {soldData.slice(0, 10).map((product, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-1.5 text-gray-600 dark:text-gray-400">{idx + 1}</td>
                  <td className="p-1.5 font-medium text-gray-800 dark:text-white truncate max-w-[120px]">
                    {product.name}
                  </td>
                  <td className="p-1.5 text-center text-gray-700 dark:text-gray-300">
                    {product.quantity}
                  </td>
                  <td className="p-1.5 text-right font-semibold text-green-600 dark:text-green-400">
                    ৳{product.revenue.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
      >
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span className="text-purple-500">💰</span> শীর্ষ ১০ লাভজনক পণ্য
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">#</th>
                <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">পণ্যের নাম</th>
                <th className="text-right p-1.5 text-gray-500 dark:text-gray-400 font-medium">মোট লাভ (৳)</th>
              </tr>
            </thead>
            <tbody>
              {profitData.slice(0, 10).map((product, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-1.5 text-gray-600 dark:text-gray-400">{idx + 1}</td>
                  <td className="p-1.5 font-medium text-gray-800 dark:text-white truncate max-w-[140px]">
                    {product.name}
                  </td>
                  <td className="p-1.5 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                    ৳{product.profit.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};