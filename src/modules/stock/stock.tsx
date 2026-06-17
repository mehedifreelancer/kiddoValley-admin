import {
  ArrowUpDown,
  Eye,
  Printer,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { StockTable, StockTableColumn } from "./StockTable";
import { FlatStockItem } from "./stock.types";

// Thumbnails component (same as before)
const VariantThumbnails = ({ images }: { images: any[] }) => {
  if (!images || images.length === 0)
    return <span className="text-gray-400">—</span>;
  return (
    <div className="flex -space-x-2">
      {images.slice(0, 3).map((img, idx) => (
        <div key={idx} className="relative group">
          <img
            src={img.imgUrl}
            alt="variant"
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(img.imgUrl, "_blank")}
            title="Click to view full image"
          />
        </div>
      ))}
      {images.length > 3 && (
        <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
          +{images.length - 3}
        </span>
      )}
    </div>
  );
};

export const Stock: React.FC = () => {
  const [stockItems, setStockItems] = useState<FlatStockItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const onSearch = useCallback((value: string) => setGlobalFilter(value), []);
  const toggleStockOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  const generateReport = useCallback(() => {
    if (stockItems.length === 0) {
      toast.error("No stock data to generate report");
      return;
    }
    let totalProducts = 0,
      totalMRP = 0,
      totalInvestment = 0,
      totalProfit = 0;
    stockItems.forEach((item) => {
      const qty = item.currentQty;
      totalProducts += qty;
      totalMRP += item.sellingPrice * qty;
      totalInvestment += item.buyingPrice * qty;
      totalProfit += (item.sellingPrice - item.buyingPrice) * qty;
    });
    setReportData({
      totalProducts,
      totalMRP,
      totalInvestment,
      totalProfit,
      generatedAt: new Date().toLocaleString(),
    });
    setShowReportModal(true);
  }, [stockItems]);

  const printReport = useCallback(() => {
    const printContent = document.getElementById("stock-report-content");
    if (!printContent) return;
    const originalTitle = document.title;
    document.title = "Stock Report";
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Stock Report</title></head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    document.title = originalTitle;
  }, []);

  const rowClassName = useCallback((rowData: FlatStockItem) => {
    if (rowData.currentQty < 6) {
      return "bg-red-900/50! text-white table-row";
    }
    return "table-row";
  }, []);

  const handleDataChange = useCallback((data: FlatStockItem[]) => {
    setStockItems(data);
  }, []);

  // Columns – stable
  const columns: StockTableColumn[] = useMemo(
    () => [
      {
        field: "variant.productName",
        header: "Product",
        sortable: true,
        body: (row) => (
          <span className="font-medium">{row.variant.productName}</span>
        ),
      },
      {
        field: "variant.sku",
        header: "SKU",
        sortable: true,
        body: (row) => (
          <span className="font-mono text-sm">{row.variant.sku}</span>
        ),
      },
      {
        field: "variant.barcode",
        header: "Barcode",
        sortable: true,
        body: (row) => (
          <span className="font-mono text-sm">
            {row.variant.barcode || "—"}
          </span>
        ),
      },
      {
        header: "Attributes",
        body: (row) => {
          const attrs = row.variant.attributes || {};
          const entries = Object.entries(attrs);
          if (entries.length === 0)
            return <span className="text-gray-400">—</span>;
          return (
            <span className="text-sm">
              {entries.map(([k, v]) => `${k}:${v}`).join(", ")}
            </span>
          );
        },
      },
      {
        header: "Batch",
        body: (row) => (
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {row.batchNo}
          </span>
        ),
      },
      {
        header: "Images",
        body: (row) => <VariantThumbnails images={row.variant.images || []} />,
        style: { width: "120px" },
      },
      {
        header: "Price",
        body: (row) => (
          <div>
            <div>Buy: {row.buyingPrice} TK</div>
            <div className="text-green-600 dark:text-green-400">
              MRP: {row.sellingPrice} TK
            </div>
          </div>
        ),
      },
      {
        header: "Discount",
        body: (row) => {
          if (row.discountPercent === 0) {
            return (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
              </span>
            );
          }
          return (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
              {row.discountPercent}% OFF
            </span>
          );
        },
      },
      {
        field: "currentQty",
        header: "Quantity",
        sortable: true,
        body: (row) => <span className="font-semibold">{row.currentQty}</span>,
      },
      {
        header: "Actions",
        body: () => (
          <div className="flex gap-2">
            <button
              className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Adjust stock (coming soon)"
              onClick={() =>
                toast.info("Adjust stock functionality will be added later")
              }
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
        style: { width: "80px" },
      },
    ],
    [],
  );

  // Build the custom Toolbar exactly as before
  const customToolbar = (
    <Toolbar title="Stock List">
      <div className="flex gap-2">
        <DataTableSearch
          value={globalFilter}
          onChange={onSearch}
          placeholder="Search by product, SKU, barcode..."
          className="w-[280px]"
        />
        <Button
          onClick={toggleStockOrder}
          variant="outline"
          className="flex items-center gap-2"
          title={`Sort by quantity (${sortOrder === "desc" ? "high to low" : "low to high"})`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="hidden sm:inline">
            Qty {sortOrder === "desc" ? "↓" : "↑"}
          </span>
        </Button>
        <Button
          onClick={generateReport}
          variant="outline"
          className="flex items-center gap-2"
          title="Stock Report"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Report</span>
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </Toolbar>
  );

  return (
    <div>
      <StockTable
        columns={columns}
        toolbar={customToolbar} // <-- custom toolbar passed here
        showSearch={false} // internal search disabled
        searchValue={globalFilter}
        onSearchChange={onSearch}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
        rowClassName={rowClassName}
        onDataChange={handleDataChange}
      />

      {/* Report Modal – unchanged */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Stock Report"
        size="md"
      >
        <div id="stock-report-content" className="space-y-4 p-2">
          {reportData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500">
                    Total Products (Units)
                  </div>
                  <div className="text-2xl font-bold">
                    {reportData.totalProducts}
                  </div>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500">Total MRP Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.totalMRP.toFixed(2)} TK
                  </div>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500">Total Investment</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.totalInvestment.toFixed(2)} TK
                  </div>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500">Estimated Profit</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.totalProfit.toFixed(2)} TK
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center pt-2">
                Generated on: {reportData.generatedAt}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={printReport}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Stock;
