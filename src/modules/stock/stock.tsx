import {
  ArrowUpDown,
  Barcode as BarcodeIcon,
  Printer,
  RefreshCw,
  RotateCw,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import Barcode from "react-barcode";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { buildStickerPrintHtml, LABEL_SIZES } from "../../lib/Barcodeprint";
import { StockTable, StockTableColumn } from "./StockTable";
import { adjustStock } from "./stock.service"; // 👈 adjust path if needed
import { FlatStockItem } from "./stock.types";
// 👇 Barcode print helpers moved to a dedicated utils file — see barcodePrint.utils.ts
// 👈 adjust path to wherever you place the utils file

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

type AdjustReasonType = "lost" | "damaged" | "count_mistake" | "other";

// 👇 NEW: shared helper — opens a print window, writes the given HTML into
// it, and waits for the window to actually finish loading/laying out
// before calling print(). Calling print() immediately after
// document.write()/close() races the browser's layout pass (especially for
// SVG content sized via flexbox), which is what caused the printed barcode
// digits to intermittently come out cropped/missing even though the HTML
// and CSS were correct. onload is the primary signal; the setTimeout is
// just a safety-net fallback in case onload doesn't fire for a
// document.write()'d window in some browser.
const openAndPrintHtml = (html: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.print();
    printWindow.close();
  };

  printWindow.onload = doPrint;
  setTimeout(doPrint, 300);
};

export const Stock: React.FC = () => {
  const [stockItems, setStockItems] = useState<FlatStockItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // 👇 Adjust Stock modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<FlatStockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity: "",
    reasonType: "lost" as AdjustReasonType,
    customReason: "",
    imageUrl: "",
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  // 👇 Print Barcode modal state — completely independent of stock quantity
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState<FlatStockItem | null>(
    null,
  );
  const [labelCount, setLabelCount] = useState("1");
  const [labelSizeIdx, setLabelSizeIdx] = useState(0);
  // 👇 NEW: toggle to rotate the sticker content 90deg (horizontal print)
  const [printHorizontal, setPrintHorizontal] = useState(false);

  useBarcodeScanner({
    inputRef: searchInputRef,
    onSearchChange: setGlobalFilter,
    onBarcodeScanned: (barcode) => {
      toast.success(`Scanned: ${barcode}`);
    },
    onClear: () => {
      console.log("Input cleared via scanner");
    },
  });
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
    // 👇 FIX: was calling printWindow.print()/close() synchronously right
    // after document.write()/close() — now routed through the shared
    // openAndPrintHtml helper so it waits for onload (see comment above).
    openAndPrintHtml(`
      <html>
        <head><title>Stock Report</title></head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
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

  // 👇 Adjust Stock handlers (this one DOES depend on stock qty — you can't deduct from 0)
  const openAdjustModal = useCallback((row: FlatStockItem) => {
    if (row.currentQty <= 0) return;
    setAdjustTarget(row);
    setAdjustForm({
      quantity: "",
      reasonType: "lost",
      customReason: "",
      imageUrl: "",
    });
    setShowAdjustModal(true);
  }, []);

  const closeAdjustModal = useCallback(() => {
    if (isAdjusting) return;
    setShowAdjustModal(false);
    setAdjustTarget(null);
  }, [isAdjusting]);

  const submitAdjustment = useCallback(async () => {
    if (!adjustTarget) return;

    const qty = parseInt(adjustForm.quantity, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > adjustTarget.currentQty) {
      toast.error(`Only ${adjustTarget.currentQty} in stock`);
      return;
    }
    if (adjustForm.reasonType === "other" && !adjustForm.customReason.trim()) {
      toast.error("Please describe the reason");
      return;
    }

    try {
      setIsAdjusting(true);
      await adjustStock({
        stockId: adjustTarget.id,
        quantity: qty,
        reasonType: adjustForm.reasonType,
        customReason: adjustForm.customReason,
        imageUrl: adjustForm.imageUrl,
      });

      toast.success("Stock adjusted");
      setShowAdjustModal(false);
      setAdjustTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  }, [adjustTarget, adjustForm]);

  // 👇 Print Barcode handlers — NEVER depends on currentQty, only on barcode existing
  const openBarcodeModal = useCallback((row: FlatStockItem) => {
    if (!row.variant.barcode) {
      toast.error("This item has no barcode assigned");
      return;
    }
    setBarcodeTarget(row);
    setLabelCount("1");
    setShowBarcodeModal(true);
  }, []);

  const closeBarcodeModal = useCallback(() => {
    setShowBarcodeModal(false);
    setBarcodeTarget(null);
  }, []);

  // 👇 Uses buildStickerPrintHtml from barcodePrint.utils — handles JsBarcode
  // SVG generation + print-window HTML/CSS, including optional 90deg rotation
  // for horizontal printing.
  const printBarcode = useCallback(() => {
    if (!barcodeTarget?.variant.barcode) return;

    const count = parseInt(labelCount, 10);
    if (!count || count <= 0) {
      toast.error("Enter a valid label quantity");
      return;
    }
    if (count > 500) {
      toast.error("Please print in smaller batches (max 500 at once)");
      return;
    }

    const size = LABEL_SIZES[labelSizeIdx];

    let printHtml: string;
    try {
      printHtml = buildStickerPrintHtml({
        sku: barcodeTarget.variant.sku,
        barcode: barcodeTarget.variant.barcode,
        size,
        count,
        horizontal: printHorizontal,
      });
    } catch (err) {
      toast.error("Failed to generate barcode for printing");
      return;
    }

    // 👇 FIX: same timing bug as printReport — print() was firing before
    // the SVG's flex-based layout had actually been computed by the new
    // window, which is why the barcode digits intermittently came out
    // cropped/missing on the physical print even after the CSS itself was
    // corrected. Now routed through openAndPrintHtml, which waits for the
    // window's onload (with a setTimeout fallback) before printing.
    openAndPrintHtml(printHtml);
  }, [barcodeTarget, labelCount, labelSizeIdx, printHorizontal]);

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
        body: (row) => {
          // Adjust: disabled at 0 stock — you can only deduct from something > 0
          const adjustDisabled = row.currentQty <= 0;
          // Print: ONLY disabled if there's no barcode at all — stock qty is IRRELEVANT here
          const printDisabled = !row.variant.barcode;

          return (
            <div className="flex gap-2">
              <button
                className={`p-1 rounded transition-colors ${
                  adjustDisabled
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                }`}
                title={
                  adjustDisabled
                    ? "No stock available to adjust"
                    : "Adjust stock"
                }
                onClick={() => !adjustDisabled && openAdjustModal(row)}
                disabled={adjustDisabled}
              >
                <Wrench className="w-4 h-4" />
              </button>

              <button
                className={`p-1 rounded transition-colors ${
                  printDisabled
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                }`}
                title={
                  printDisabled
                    ? "No barcode assigned"
                    : "Print barcode label (works even at 0 stock)"
                }
                onClick={() => !printDisabled && openBarcodeModal(row)}
                disabled={printDisabled}
              >
                <BarcodeIcon className="w-4 h-4" />
              </button>
            </div>
          );
        },
        style: { width: "100px" },
      },
    ],
    [openAdjustModal, openBarcodeModal],
  );

  // Toolbar
  const customToolbar = (
    <Toolbar title="Stock List">
      <div className="flex gap-2">
        <DataTableSearch
          ref={searchInputRef}
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
          onClick={() => setRefreshKey((k) => k + 1)}
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
        key={refreshKey}
        columns={columns}
        toolbar={customToolbar}
        showSearch={false}
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

      {/* Report Modal */}
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
        <div className="flex justify-end gap-3 mt-6 py-2 border-t dark:border-gray-700">
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

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={closeAdjustModal}
        title="Adjust Stock"
        size="sm"
      >
        <div className="space-y-4 p-2">
          {adjustTarget && (
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {adjustTarget.variant.productName}
              </span>{" "}
              · SKU: {adjustTarget.variant.sku} · Current qty:{" "}
              <span className="font-semibold">{adjustTarget.currentQty}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Quantity to remove
            </label>
            <input
              type="number"
              min={1}
              max={adjustTarget?.currentQty}
              value={adjustForm.quantity}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, quantity: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g. 2"
              disabled={isAdjusting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={adjustForm.reasonType}
              onChange={(e) =>
                setAdjustForm((f) => ({
                  ...f,
                  reasonType: e.target.value as AdjustReasonType,
                }))
              }
              className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              disabled={isAdjusting}
            >
              <option value="lost">Lost</option>
              <option value="damaged">Damaged</option>
              <option value="count_mistake">Count Mistake</option>
              <option value="other">Other</option>
            </select>
          </div>

          {adjustForm.reasonType === "other" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Describe the reason
              </label>
              <input
                type="text"
                value={adjustForm.customReason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, customReason: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                placeholder="Explain what happened"
                disabled={isAdjusting}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Proof image link <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={adjustForm.imageUrl}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              placeholder="Google Drive / image URL"
              disabled={isAdjusting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 py-2 border-t dark:border-gray-700">
          <Button
            variant="outline"
            onClick={closeAdjustModal}
            disabled={isAdjusting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitAdjustment}
            disabled={isAdjusting}
          >
            {isAdjusting ? "Adjusting..." : "Adjust"}
          </Button>
        </div>
      </Modal>

      {/* Print Barcode Modal — Thermal label (always available, regardless of stock qty) */}
      <Modal
        isOpen={showBarcodeModal}
        onClose={closeBarcodeModal}
        title="Print Barcode Label"
        size="sm"
      >
        <div className="space-y-4 p-2">
          {barcodeTarget && (
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {barcodeTarget.variant.productName}
              </span>{" "}
              · In stock: {barcodeTarget.currentQty}
            </div>
          )}

          {/* Preview mimicking the thermal sticker layout: SKU on top, barcode with digits below.
              This still uses <Barcode> directly in the React tree (mounted, real DOM),
              so it renders fine here — the bug only affected the print-window HTML string.
              Note: this preview does NOT reflect the horizontal rotation toggle below —
              rotation only applies to the actual print output. */}
          <div className="flex flex-col items-center justify-center border rounded-md p-4 dark:border-gray-700 bg-white">
            <div className="text-xs font-mono font-bold tracking-wide mb-2 text-gray-900">
              {barcodeTarget?.variant.sku}
            </div>
            {barcodeTarget?.variant.barcode && (
              <Barcode
                value={barcodeTarget.variant.barcode}
                format="CODE128"
                width={1.6}
                height={45}
                fontSize={12}
                displayValue={true}
                margin={0}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Label size (Choose : 1.50" x 1.00" paper size)
            </label>
            <select
              value={labelSizeIdx}
              onChange={(e) => setLabelSizeIdx(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              {LABEL_SIZES.map((s, idx) => (
                <option key={s.label} value={idx}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 👇 NEW: horizontal (rotate 90deg) print toggle */}
          <div className="flex items-center justify-between border rounded-md px-3 py-2 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Print horizontally</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={printHorizontal}
              onClick={() => setPrintHorizontal((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                printHorizontal
                  ? "bg-indigo-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  printHorizontal ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Number of labels to print
            </label>
            <input
              type="number"
              min={1}
              value={labelCount}
              onChange={(e) => setLabelCount(e.target.value)}
              className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g. 5"
            />
            <p className="text-xs text-gray-400 mt-1">
              Prints exactly this many stickers, one after another on your
              thermal roll — independent of current stock.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 py-2 border-t dark:border-gray-700">
          <Button variant="outline" onClick={closeBarcodeModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={printBarcode}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print {labelCount || 0} Label
            {parseInt(labelCount, 10) !== 1 ? "s" : ""}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Stock;
