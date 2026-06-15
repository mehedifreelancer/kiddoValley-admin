import {
  ArrowUpDown,
  Eye,
  Printer,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { getStockList } from "./stock.service";
import { FlatStockItem } from "./stock.types";

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
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStockList(
        page,
        rows,
        globalFilter,
        sortField,
        sortOrder,
      );
      setStockItems(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      toast.error("Failed to load stock data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, rows, globalFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const onPageChange = (event: any) => {
    setPage(event.page + 1);
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder === 1 ? "asc" : "desc");
  };

  const onSearch = (value: string) => {
    setGlobalFilter(value);
    setPage(1);
  };

  const toggleStockOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const generateReport = () => {
    if (stockItems.length === 0) {
      toast.error("No stock data to generate report");
      return;
    }
    let totalProducts = 0;
    let totalMRP = 0;
    let totalInvestment = 0;
    let totalProfit = 0;

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
  };

  const printReport = () => {
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
  };

  // ✅ Row class for low stock highlighting (bg-red-500 when quantity < 6)
  const rowClassName = (rowData: FlatStockItem) => {
    if (rowData.currentQty < 6) {
      return "bg-red-900/50! text-white table-row";
    }
    return "table-row";
  };

  // Column templates
  const productNameBody = (row: FlatStockItem) => (
    <span className="font-medium">{row.variant.productName}</span>
  );
  const skuBody = (row: FlatStockItem) => (
    <span className="font-mono text-sm">{row.variant.sku}</span>
  );
  const barcodeBody = (row: FlatStockItem) => (
    <span className="font-mono text-sm">{row.variant.barcode || "—"}</span>
  );
  const attributesBody = (row: FlatStockItem) => {
    const attrs = row.variant.attributes || {};
    const entries = Object.entries(attrs);
    if (entries.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <span className="text-sm">
        {entries.map(([k, v]) => `${k}:${v}`).join(", ")}
      </span>
    );
  };
  const priceBody = (row: FlatStockItem) => (
    <div>
      <div>Buy: {row.buyingPrice} TK</div>
      <div className="text-green-600 dark:text-green-400">
        MRP: {row.sellingPrice} TK
      </div>
    </div>
  );
  const discountBody = (row: FlatStockItem) => {
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
  };
  const quantityBody = (row: FlatStockItem) => (
    <span className="font-semibold">{row.currentQty}</span>
  );
  const batchBody = (row: FlatStockItem) => (
    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
      {row.batchNo}
    </span>
  );
  const imageBody = (row: FlatStockItem) => (
    <VariantThumbnails images={row.variant.images || []} />
  );
  const actionsBody = () => (
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
  );

  if (loading && stockItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
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
            onClick={fetchStock}
            variant="outline"
            className="flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={stockItems}
          lazy
          paginator
          rows={rows}
          totalRecords={totalRecords}
          first={(page - 1) * rows}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          loading={loading}
          emptyMessage="No stock batches found"
          // ❌ stripedRows removed to avoid class conflict
          rowClassName={rowClassName}
        >
          <Column
            field="variant.productName"
            header="Product"
            sortable
            body={productNameBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="variant.sku"
            header="SKU"
            sortable
            body={skuBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="variant.barcode"
            header="Barcode"
            sortable
            body={barcodeBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Attributes"
            body={attributesBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Batch"
            body={batchBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Images"
            body={imageBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "120px" }}
          />
          <Column
            header="Price"
            body={priceBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Discount"
            body={discountBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="currentQty"
            header="Quantity"
            sortable
            body={quantityBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Actions"
            body={actionsBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "80px" }}
          />
        </DataTable>
      </div>

      {/* Stock Report Modal */}
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
