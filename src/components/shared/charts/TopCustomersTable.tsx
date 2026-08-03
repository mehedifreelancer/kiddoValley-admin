import { motion } from "framer-motion";
import { TopCustomer } from "../../../modules/dashboard/dashboard.types";

interface TopCustomersTableProps {
  data: TopCustomer[];
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  data,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-gray-200/50 dark:border-gray-700/50"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="text-yellow-500">🏆</span> টপ গ্রাহক
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                #
              </th>
              <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                নাম
              </th>
              <th className="text-left p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                ফোন
              </th>
              <th className="text-center p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                অর্ডার
              </th>
              <th className="text-right p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                মোট খরচ
              </th>
              <th className="text-center p-1.5 text-gray-500 dark:text-gray-400 font-medium">
                স্ট্যাটাস
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer, idx) => {
              const isPremium = customer.totalSpent > 5000;
              const isReturning = customer.totalOrders > 1;
              return (
                <tr
                  key={customer.phone}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-1.5 text-gray-700 dark:text-gray-300">
                    {idx + 1}
                  </td>
                  <td className="p-1.5 font-medium text-gray-800 dark:text-white">
                    {customer.name}
                  </td>
                  <td className="p-1.5 text-gray-600 dark:text-gray-400">
                    {customer.phone}
                  </td>
                  <td className="p-1.5 text-center text-gray-700 dark:text-gray-300">
                    {customer.totalOrders}
                  </td>
                  <td className="p-1.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                    ৳{customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="p-1.5 text-center">
                    {isPremium && (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full">
                        🏆 প্রিমিয়াম
                      </span>
                    )}
                    {isReturning && !isPremium && (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        🔄 রিটার্নিং
                      </span>
                    )}
                    {!isReturning && (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                        নতুন
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
