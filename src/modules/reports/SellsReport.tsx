"use client";

import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Loader2, Package, Printer, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Toolbar from "../../components/ui/Toolbar";
import { fetchSellsReport } from "./sells-report.service";

// ==================== টাইপ ====================
interface SoldItem {
  id: number;
  productName: string;
  buyPrice: number;
  sellingPrice: number;
  soldPrice: number;
  weight: number;
  grossProfit: number;
  deliveryCharge: number;
  packagingCost: number; // 🆕
  returnAmount: number;
  netProfit: number;
}

interface OrderData {
  invoiceNo: string;
  items: SoldItem[];
  orderTotals?: {
    deliveryCharge: number;
    packagingCost: number;
    refundTotal: number;
    total: number; // 🆕 order টেবিলের নিজস্ব total কলাম — Total Bill দেখানোর জন্য
  };
}

// ==================== মূল কম্পোনেন্ট ====================
export const SellsReport: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number | "today">("today");

  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellsReport(start, end);
      setOrders(result);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const handleDaysClick = (d: number | "today") => {
    setDays(d);
    if (d === "today") {
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(today);
      fetchData(today, today);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - d);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchData(startStr, endStr);
    }
  };

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      setDays("today");
      fetchData(startDate, endDate);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    handleDaysClick("today");
  };

  useEffect(() => {
    handleDaysClick("today");
  }, []);

  // ✅ একটা order-এর items থেকে order-level totals বের করার হেল্পার —
  // দুই জায়গায় (স্ক্রিন টেবিল + PDF) একই লজিক লাগে বলে আলাদা ফাংশন করা হলো
  const calcOrderTotals = (order: OrderData) =>
    order.items.reduce(
      (acc, item) => {
        acc.buyPrice += item.buyPrice * item.weight;
        acc.sellingPrice += item.sellingPrice * item.weight;
        acc.soldPrice += item.soldPrice * item.weight;
        acc.weight += item.weight;
        acc.grossProfit += item.grossProfit;
        acc.deliveryCharge += item.deliveryCharge;
        acc.packagingCost += item.packagingCost;
        acc.returnAmount += item.returnAmount;
        acc.netProfit += item.netProfit;
        return acc;
      },
      {
        buyPrice: 0,
        sellingPrice: 0,
        soldPrice: 0,
        weight: 0,
        grossProfit: 0,
        deliveryCharge: 0,
        packagingCost: 0,
        returnAmount: 0,
        netProfit: 0,
      },
    );

  // ==================== টোটাল ====================
  const totals = orders.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        acc.buyPrice += item.buyPrice * item.weight;
        acc.sellingPrice += item.sellingPrice * item.weight;
        acc.soldPrice += item.soldPrice * item.weight;
        acc.weight += item.weight;
        acc.grossProfit += item.grossProfit;
        acc.deliveryCharge += item.deliveryCharge;
        acc.packagingCost += item.packagingCost;
        acc.returnAmount += item.returnAmount;
        acc.netProfit += item.netProfit;
      });
      return acc;
    },
    {
      buyPrice: 0,
      sellingPrice: 0,
      soldPrice: 0,
      weight: 0,
      grossProfit: 0,
      deliveryCharge: 0,
      packagingCost: 0,
      returnAmount: 0,
      netProfit: 0,
    },
  );

  // ==================== ফরম্যাটিং ====================
  const formatProfit = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  // ==================== PDF ====================
  const downloadPDF = () => {
    const doc = new jsPDF("landscape", "pt", "a4");
    doc.setFontSize(18);
    doc.text("Sells Report", 40, 40);
    doc.setFontSize(10);
    doc.text(
      `Date Range: ${startDate || "Today"} to ${endDate || "Today"}`,
      40,
      60,
    );

    let startY = 70;

    orders.forEach((order, idx) => {
      doc.setFontSize(12);
      const invoiceLine =
        order.orderTotals?.total !== undefined
          ? `Invoice: ${order.invoiceNo}   |   Total Bill: TK ${order.orderTotals.total.toFixed(2)}`
          : `Invoice: ${order.invoiceNo}`;
      doc.text(invoiceLine, 40, startY);
      startY += 15;

      // ✅ Order-level total আগে বের করে নেওয়া হচ্ছে, যাতে টেবিলের প্রথম
      // row-এ rowSpan cell আর নিচের "Order Total -" লাইন দুটোতেই ব্যবহার
      // করা যায় — একই সোর্স, দুই জায়গায় ডুপ্লিকেট হিসাব না হয়ে যায়
      const orderTotals = order.orderTotals ?? calcOrderTotals(order);
      const summedTotals = calcOrderTotals(order); // পুরো row-এর জন্য baseline সবসময় items থেকেই লাগবে

      const tableBody = order.items.map((item, itemIdx) => {
        // ✅ B.price / S Price / Sold price এখন line-total (দাম × weight)
        // হিসেবে দেখানো হচ্ছে — Gross Profit কলাম আগে থেকেই এভাবে
        // (weight-multiplied) আসে, তাই সব কলাম এক convention-এ থাকল এবং
        // row-গুলো সরাসরি যোগ করলে Order Total-এর সাথে মিলে যাবে
        const row: any[] = [
          // ✅ item.weight আসলে quantity — প্রোডাক্ট নামের পাশে ×N দেখানো হচ্ছে
          `${item.productName} ×${Number.isInteger(item.weight) ? item.weight : item.weight.toFixed(1)}`,
          (item.buyPrice * item.weight).toFixed(2),
          (item.sellingPrice * item.weight).toFixed(2),
          (item.soldPrice * item.weight).toFixed(2),
          item.weight.toFixed(1),
          item.grossProfit.toFixed(2),
        ];

        // ✅ Delivery charge ও Packaging cost — প্রতি আইটেমে ভাগ করে না
        // দেখিয়ে, পুরো অর্ডারের জন্য একবারই (প্রথম row-এ) rowSpan দিয়ে
        // merged column হিসেবে দেখানো হচ্ছে
        if (itemIdx === 0) {
          row.push({
            content: orderTotals.deliveryCharge.toFixed(2),
            rowSpan: order.items.length,
            styles: { valign: "middle" },
          });
          row.push({
            content: orderTotals.packagingCost.toFixed(2),
            rowSpan: order.items.length,
            styles: { valign: "middle" },
          });
        }

        row.push(item.returnAmount.toFixed(2));
        row.push(formatProfit(item.netProfit));
        return row;
      });

      autoTable(doc, {
        startY,
        head: [
          [
            "P. Name",
            "B. price",
            "S Price",
            "Sold price",
            "Weight",
            "Gross Profit",
            "D Charge",
            "Pack Cost",
            "R. amount",
            "Net profit",
          ],
        ],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8 },
      });

      startY = (doc as any).lastAutoTable.finalY + 20;

      doc.setFontSize(10);
      doc.text(
        `Order Total - B.price: ${summedTotals.buyPrice.toFixed(2)}, S.Price: ${summedTotals.sellingPrice.toFixed(2)}, Sold: ${summedTotals.soldPrice.toFixed(2)}, Weight: ${summedTotals.weight.toFixed(1)}, Gross: ${summedTotals.grossProfit.toFixed(2)}, Delivery: ${orderTotals.deliveryCharge.toFixed(2)}, Pack: ${orderTotals.packagingCost.toFixed(2)}, Return: ${summedTotals.returnAmount.toFixed(2)}, Net: ${formatProfit(summedTotals.netProfit)}`,
        40,
        startY,
      );
      startY += 25;

      if (idx < orders.length - 1) {
        doc.setDrawColor(200);
        doc.line(40, startY - 10, 800 - 40, startY - 10);
        startY += 15;
      }
    });

    doc.setFontSize(12);
    doc.text("Grand Total", 40, startY + 10);
    const totalBody = [
      [
        "",
        totals.buyPrice.toFixed(2),
        totals.sellingPrice.toFixed(2),
        totals.soldPrice.toFixed(2),
        totals.weight.toFixed(1),
        totals.grossProfit.toFixed(2),
        totals.deliveryCharge.toFixed(2),
        totals.packagingCost.toFixed(2),
        totals.returnAmount.toFixed(2),
        formatProfit(totals.netProfit),
      ],
    ];
    autoTable(doc, {
      startY: startY + 20,
      head: [
        [
          "Total",
          "B. price",
          "S Price",
          "Sold price",
          "Weight",
          "Gross Profit",
          "D Charge",
          "Pack Cost",
          "R. amount",
          "Net profit",
        ],
      ],
      body: totalBody,
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text(
      `Total Net Profit: TK ${formatProfit(totals.netProfit)} | Orders: ${orders.length} | Products: ${orders.reduce(
        (acc, o) => acc + o.items.length,
        0,
      )}`,
      40,
      finalY,
    );

    doc.save("sells-report.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="text-lg">{error}</p>
        <button
          onClick={() =>
            fetchData(startDate || undefined, endDate || undefined)
          }
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div>
        {/* ======== টুলবার ======== */}
        <Toolbar title="Sells Report">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => handleDaysClick("today")}
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                  days === "today"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50"
                }`}
              >
                আজ
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              {[7, 30, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDaysClick(d)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    days === d
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {d === 7
                    ? "৭দিন"
                    : d === 30
                      ? "৩০দিন"
                      : d === 90
                        ? "৯০দিন"
                        : "১৮০দিন"}
                </button>
              ))}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-1 w-32"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-1 w-32"
              />
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
              >
                প্রয়োগ
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
              >
                রিসেট
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </Toolbar>

        {/* === রিপোর্ট কন্টেন্ট === */}
        <div ref={reportRef} className="print-content mt-4">
          {orders.map((order, orderIdx) => {
            // ✅ order-level totals — header summary + rowSpan merged column
            // + tfoot, তিন জায়গাতেই এই একটাই সোর্স ব্যবহার হচ্ছে
            const orderTotals = order.orderTotals ?? calcOrderTotals(order);
            const summedTotals = calcOrderTotals(order);

            return (
              <motion.div
                key={order.invoiceNo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: orderIdx * 0.1 }}
                className="mb-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
              >
                <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-3 flex-wrap">
                    <span>Invoice: {order.invoiceNo}</span>
                    {order.orderTotals?.total !== undefined && (
                      <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Total Bill: ৳{order.orderTotals.total.toFixed(2)}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      D: {orderTotals.deliveryCharge.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      P: {orderTotals.packagingCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="responsive-table w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-2 font-semibold">P. Name</th>
                        <th className="px-4 py-2 font-semibold text-right">
                          B. price
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          S Price
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          Sold price
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          Weight
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          Gross Profit
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          <Truck className="w-4 h-4 inline" /> D Charge
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          <Package className="w-4 h-4 inline" /> Pack Cost
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          R. amount
                        </th>
                        <th className="px-4 py-2 font-semibold text-right">
                          Net profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {order.items.map((item, itemIdx) => {
                        const isProfit = item.netProfit >= 0;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td
                              data-label="P. Name"
                              className="px-4 py-2 font-medium text-gray-800 dark:text-white"
                            >
                              {item.productName}
                              {/* ✅ item.weight আসলে quantity (কয়টি নেওয়া
                                  হয়েছে) — প্রোডাক্ট নামের পাশেই ছোট badge
                                  আকারে দেখানো হচ্ছে, যাতে সহজেই বোঝা যায় */}
                              <span className="ml-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 align-middle">
                                ×
                                {Number.isInteger(item.weight)
                                  ? item.weight
                                  : item.weight.toFixed(1)}
                              </span>
                            </td>
                            <td
                              data-label="B. price"
                              className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 text-sm"
                            >
                              ৳{(item.buyPrice * item.weight).toFixed(2)}
                            </td>
                            <td
                              data-label="S Price"
                              className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 text-sm"
                            >
                              ৳{(item.sellingPrice * item.weight).toFixed(2)}
                            </td>
                            <td
                              data-label="Sold price"
                              className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 text-sm"
                            >
                              ৳{(item.soldPrice * item.weight).toFixed(2)}
                            </td>
                            <td
                              data-label="Weight"
                              className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 text-sm"
                            >
                              {item.weight.toFixed(1)}
                            </td>
                            <td
                              data-label="Gross Profit"
                              className="px-4 py-2 text-right text-green-600 dark:text-green-400 text-sm font-medium"
                            >
                              ৳{item.grossProfit.toFixed(2)}
                            </td>

                            {/* ✅ Delivery charge ও Packaging cost — প্রতি
                                আইটেমে ভাগ করে না দেখিয়ে, পুরো অর্ডারের
                                items row-গুলোর উপর rowSpan দিয়ে merge করা
                                একটা shared column হিসেবে শুধু প্রথম row-এ
                                একবারই রেন্ডার হচ্ছে */}
                            {itemIdx === 0 && (
                              <td
                                data-label="D Charge"
                                rowSpan={order.items.length}
                                className="px-4 py-2 text-right text-indigo-700 dark:text-indigo-300 text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 align-middle"
                              >
                                ৳{orderTotals.deliveryCharge.toFixed(2)}
                              </td>
                            )}
                            {itemIdx === 0 && (
                              <td
                                data-label="Pack Cost"
                                rowSpan={order.items.length}
                                className="px-4 py-2 text-right text-purple-700 dark:text-purple-300 text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 align-middle"
                              >
                                ৳{orderTotals.packagingCost.toFixed(2)}
                              </td>
                            )}

                            <td
                              data-label="R. amount"
                              className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 text-sm"
                            >
                              ৳{item.returnAmount.toFixed(2)}
                            </td>
                            <td
                              data-label="Net profit"
                              className={`px-4 py-2 text-right font-bold text-base ${
                                isProfit
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              }`}
                            >
                              {formatProfit(item.netProfit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50/70 dark:bg-gray-700/30 border-t border-gray-300 dark:border-gray-600 font-semibold">
                      <tr>
                        <td
                          className="px-4 py-2 text-right text-gray-600 dark:text-gray-200"
                          colSpan={1}
                        >
                          Order Total:
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">
                          ৳{summedTotals.buyPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">
                          ৳{summedTotals.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">
                          ৳{summedTotals.soldPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">
                          {summedTotals.weight.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">
                          ৳{summedTotals.grossProfit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-indigo-600 dark:text-indigo-400">
                          ৳{orderTotals.deliveryCharge.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-purple-600 dark:text-purple-400">
                          ৳{orderTotals.packagingCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ৳{summedTotals.returnAmount.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right ${
                            summedTotals.netProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatProfit(summedTotals.netProfit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            );
          })}

          {/* === গ্র্যান্ড টোটাল ও সারাংশ === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Grand Total & Summary
              </h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                      Metric
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total B. price
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      ৳{totals.buyPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total S Price
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      ৳{totals.sellingPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Sold price
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      ৳{totals.soldPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Weight
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      {totals.weight.toFixed(1)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Gross Profit
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">
                      ৳{totals.grossProfit.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-indigo-50/50 dark:bg-indigo-900/20">
                    <td className="px-4 py-2 text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                      <Truck className="w-4 h-4" />
                      Total Delivery Charge
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      ৳{totals.deliveryCharge.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-purple-50/50 dark:bg-purple-900/20">
                    <td className="px-4 py-2 text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                      <Package className="w-4 h-4" />
                      Total Packaging Cost
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-purple-700 dark:text-purple-300">
                      ৳{totals.packagingCost.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Return Amount
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">
                      ৳{totals.returnAmount.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Orders
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      {orders.length}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Total Products
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-800 dark:text-white">
                      {orders.reduce((acc, o) => acc + o.items.length, 0)}
                    </td>
                  </tr>

                  {/* ===== শেষ সারি: Total Net Profit/Loss ===== */}
                  <tr className="border-t-2 border-indigo-300 dark:border-indigo-700">
                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-white text-base">
                      Total Net Profit / Loss
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold text-xl ${
                        totals.netProfit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatProfit(totals.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ======== রেস্পন্সিভ ও প্রিন্ট CSS ======== */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-table thead { display: none; }
          .responsive-table,
          .responsive-table tbody,
          .responsive-table tr,
          .responsive-table td {
            display: block;
            width: 100%;
          }
          .responsive-table tr {
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(4px);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .dark .responsive-table tr {
            background: rgba(31, 41, 55, 0.6);
            border-color: #374151;
          }
          .responsive-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.6rem 1rem;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.875rem;
          }
          .dark .responsive-table td { border-bottom-color: #374151; }
          .responsive-table td:last-child { border-bottom: none; }
          .responsive-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #6b7280;
            flex: 0 0 40%;
          }
          .dark .responsive-table td::before { color: #9ca3af; }
          .responsive-table td[data-label="Net profit"] {
            font-size: 1.1rem;
            font-weight: 700;
            background-color: inherit;
            border-radius: 0.25rem;
          }
          .responsive-table td:not([data-label="Net profit"]) {
            font-size: 0.8rem;
          }
        }

        @media print {
          .no-print { display: none !important; }
          .print-content {
            padding: 0.5in;
            background: white !important;
            color: black !important;
          }
          .responsive-table td {
            background-color: white !important;
            color: black !important;
            border-color: #ccc !important;
          }
          .responsive-table td[data-label="Net profit"] {
            background-color: #f3f4f6 !important;
            color: #111827 !important;
          }
          .responsive-table tr {
            background: white !important;
            border-color: #ccc !important;
            box-shadow: none !important;
          }
          .dark .responsive-table tr { background: white !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default SellsReport;
