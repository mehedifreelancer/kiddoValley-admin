import { ArrowUpDown, Delete, Plus, Trash2 } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { StockTable, StockTableColumn } from "../stock/StockTable";
import { FlatStockItem } from "../stock/stock.types";
import { getSuppliers } from "../supplier/supplier.service";
import { Supplier } from "../supplier/supplier.types";
import { stockInPayloadSchema } from "./stockIn.schema";
import { createStockIn } from "./stockIn.service";
import { StockInItem } from "./stockIn.types";

// ---------- Thumbnails (unchanged) ----------
const VariantThumbnails = ({ images }: { images: any[] }) => {
  if (!images || images.length === 0)
    return <span className="text-gray-400">—</span>;
  return (
    <div className="flex -space-x-2">
      {images.slice(0, 3).map((img, idx) => (
        <img
          key={idx}
          src={img.imgUrl}
          alt="variant"
          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.open(img.imgUrl, "_blank")}
          title="Click to view full image"
        />
      ))}
      {images.length > 3 && (
        <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
          +{images.length - 3}
        </span>
      )}
    </div>
  );
};

// ---------- Helper (unchanged) ----------
const formatDiscount = (sellingPrice: number, discountPercent: number) => {
  const amount = (sellingPrice * discountPercent) / 100;
  return `${discountPercent}% (${amount.toFixed(2)} TK)`;
};

// ---------- Main Component ----------
export const StockIn: React.FC = () => {
  // Supplier & date
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [stockInDate, setStockInDate] = useState<Date>(new Date());

  // Stock in items
  const [stockInItems, setStockInItems] = useState<StockInItem[]>([]);

  // All stock items (from left table)
  const [allStockItems, setAllStockItems] = useState<FlatStockItem[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedVariantStocks, setSelectedVariantStocks] = useState<
    FlatStockItem[]
  >([]);

  // Sorting state
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        toast.error("Failed to load suppliers");
      }
    };
    loadSuppliers();
  }, []);

  // ---------- Stock table handlers ----------
  const handleStockDataChange = useCallback((data: FlatStockItem[]) => {
    setAllStockItems(data);
  }, []);

  // Update quantity in stock-in table
  const updateQuantity = useCallback((stockId: number, newQty: number) => {
    setStockInItems((prev) => {
      const items = Array.isArray(prev) ? prev : [];
      return items.map((item) => {
        if (item.stockId !== stockId) return item;
        const qty = Math.max(1, newQty);
        return {
          ...item,
          quantity: qty,
          total: item.buyingPrice * qty,
        };
      });
    });
  }, []);

  // Direct addition (used by modal and single-batch case)
  const addItemToStockIn = useCallback(
    (stock: FlatStockItem) => {
      const items = Array.isArray(stockInItems) ? stockInItems : [];
      const existing = items.find((item) => item.stockId === stock.id);
      if (existing) {
        // If already in list, just increment
        const newQty = existing.quantity + 1;
        updateQuantity(stock.id, newQty);
        toast.success(`Quantity increased to ${newQty}`);
        return;
      }
      const newItem: StockInItem = {
        stockId: stock.id,
        batchNo: stock.batchNo,
        productName: stock.variant.productName,
        sku: stock.variant.sku,
        buyingPrice: stock.buyingPrice,
        sellingPrice: stock.sellingPrice,
        discountPercent: stock.discountPercent,
        quantity: 1,
        total: stock.buyingPrice,
      };
      setStockInItems((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        return [...current, newItem];
      });
      toast.success(`Added ${stock.variant.productName}`);
    },
    [stockInItems, updateQuantity],
  );

  // Main entry point for "Select" button – decides whether to show batch modal
  const handleAddToStockIn = useCallback(
    (stock: FlatStockItem) => {
      // Check if this exact stock is already in the list
      const alreadyInList = stockInItems.some(
        (item) => item.stockId === stock.id,
      );
      if (alreadyInList) {
        // Just increment
        addItemToStockIn(stock);
        return;
      }

      // Find all batches for the same variant
      const batches = allStockItems.filter(
        (s) => s.variant.id === stock.variant.id,
      );

      if (batches.length > 1) {
        // Show modal to let user choose which batch
        setSelectedVariantStocks(batches);
        setShowBatchModal(true);
      } else {
        // Only one batch – add directly
        addItemToStockIn(stock);
      }
    },
    [stockInItems, allStockItems, addItemToStockIn],
  );

  // Called from the batch modal's "Select" button
  const addOrIncrementStock = useCallback(
    (stock: FlatStockItem) => {
      // Check if this stock is already in the list
      const existing = stockInItems.find((item) => item.stockId === stock.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        updateQuantity(stock.id, newQty);
        toast.success(`Quantity increased to ${newQty}`);
      } else {
        addItemToStockIn(stock);
      }
      setShowBatchModal(false);
    },
    [stockInItems, updateQuantity, addItemToStockIn],
  );

  const removeItem = useCallback((stockId: number) => {
    setStockInItems((prev) => {
      const items = Array.isArray(prev) ? prev : [];
      return items.filter((item) => item.stockId !== stockId);
    });
  }, []);

  const clearAllItems = useCallback(() => {
    const items = Array.isArray(stockInItems) ? stockInItems : [];
    if (items.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setStockInItems([]);
    toast.success("All items cleared.");
  }, [stockInItems]);

  // Totals
  const items = Array.isArray(stockInItems) ? stockInItems : [];
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = subtotal;

  // Validation
  const isFormValid = useCallback(() => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return false;
    }
    const items = Array.isArray(stockInItems) ? stockInItems : [];
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }
    return true;
  }, [selectedSupplier, stockInItems]);

  const handleNext = () => {
    if (!isFormValid()) return;
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    const items = Array.isArray(stockInItems) ? stockInItems : [];
    if (items.length === 0) {
      toast.error("No items to stock in");
      return;
    }
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    const payload = {
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      stockInDate: stockInDate.toISOString(),
      items: items.map((item) => ({
        stockId: item.stockId,
        quantity: item.quantity,
        unitPrice: item.buyingPrice,
        totalPrice: item.total,
      })),
      subtotal,
      total,
    };

    const result = stockInPayloadSchema.safeParse(payload);
    if (!result.success) {
      const errorMessages =
        result.error?.errors?.map((e) => e.message).join(", ") ||
        "Validation failed";
      toast.error(`Validation failed: ${errorMessages}`);
      console.error("Validation error:", result.error);
      return;
    }

    try {
      await createStockIn(payload);
      toast.success("Stock In completed successfully!");
      setStockInItems([]);
      setSelectedSupplier(null);
      setStockInDate(new Date());
      setShowConfirmModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create stock in");
    }
  };

  // ---------- Left Stock Table Columns ----------
  const stockColumns: StockTableColumn[] = [
    {
      header: "Product Name",
      body: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {row.variant.productName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {row.variant.sku}
          </div>
        </div>
      ),
    },
    { field: "variant.sku", header: "SKU" },
    {
      field: "buyingPrice",
      header: "Buying Price",
      sortable: true,
      body: (row) => `${row.buyingPrice} TK`,
    },
    {
      field: "sellingPrice",
      header: "Selling Price",
      sortable: true,
      body: (row) => `${row.sellingPrice} TK`,
    },
    {
      header: "Images",
      body: (row) => <VariantThumbnails images={row.variant.images || []} />,
      style: { width: "100px" },
    },
    {
      field: "currentQty",
      header: "Quantity",
      sortable: true,
      body: (row) => (
        <span
          className={
            row.currentQty < 6
              ? "text-red-600 font-semibold"
              : "text-gray-800 dark:text-gray-200"
          }
        >
          {row.currentQty}
        </span>
      ),
    },
    {
      header: "Action",
      body: (row) => (
        <Button
          size="small"
          variant="outline"
          onClick={() => handleAddToStockIn(row)}
          className="flex items-center gap-1 p-button-sm"
        >
          <Plus className="w-4 h-4" />
          Select
        </Button>
      ),
      style: { width: "110px" },
    },
  ];

  const rowClassName = useCallback((row: FlatStockItem) => {
    if (row.currentQty < 6) return "bg-red-900/50! text-white table-row";
    return "table-row";
  }, []);

  const toggleSort = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const toolbarChildren = (
    <Button
      size="xs"
      variant="outline"
      onClick={toggleSort}
      className="flex items-center gap-1"
    >
      <ArrowUpDown className="w-4 h-4" />
      <span>Qty {sortOrder === "asc" ? "↑" : "↓"}</span>
    </Button>
  );

  // ---------- Right Stock-In Table Templates (unchanged) ----------
  const stockInProductBody = (row: StockInItem) => (
    <div>
      <div className="font-medium text-gray-800 dark:text-gray-200">
        {row.productName}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</div>
    </div>
  );

  const stockInQuantityBody = (row: StockInItem) => (
    <InputNumber
      value={row.quantity}
      onValueChange={(e) => updateQuantity(row.stockId, e.value || 1)}
      min={1}
      size={2}
      className="w-20"
    />
  );

  const stockInTotalBody = (row: StockInItem) => (
    <span className="font-semibold text-gray-800 dark:text-gray-200">
      {row.total.toFixed(2)} TK
    </span>
  );

  const stockInActionsBody = (row: StockInItem) => (
    <Button
      size="small"
      variant="danger"
      onClick={() => removeItem(row.stockId)}
      className="p-button-sm flex items-center gap-1"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );

  // ---------- Render ----------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
      {/* Left – Stock List */}
      <StockTable
        key={JSON.stringify(items)}
        title="Stock List"
        columns={stockColumns}
        showSearch={true}
        onlyInStock={false}
        rowClassName={rowClassName}
        onDataChange={handleStockDataChange}
        sortField={sortField}
        sortOrder={sortOrder}
        wrapperClass="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
        toolbarChildren={toolbarChildren}
        searchInputRef={searchInputRef}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Right Column – Stock In */}
      <div className="flex flex-col gap-2">
        {/* Panel 1: Stock In (table + totals) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[550px] overflow-scroll">
          <Toolbar title="Stock In">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="xs"
                variant="danger"
                onClick={clearAllItems}
                className="flex items-center gap-1"
              >
                <Delete className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </Toolbar>

          <div className="table-container p-1">
            <DataTable
              value={items}
              emptyMessage="No items added yet"
              size="small"
              className="w-full"
              stripedRows
            >
              <Column
                header="Product"
                body={stockInProductBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="batchNo"
                header="Batch"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="buyingPrice"
                header="U. Buying Price"
                body={(row) => `${row.buyingPrice} TK`}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Qty"
                body={stockInQuantityBody}
                style={{ width: "100px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Line Total"
                body={stockInTotalBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Actions"
                body={stockInActionsBody}
                style={{ width: "80px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
            </DataTable>
          </div>

          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Total Items:
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {totalItems}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Subtotal:
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {subtotal.toFixed(2)} TK
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-1">
              <span className="text-gray-800 dark:text-gray-200">Total:</span>
              <span className="text-green-600 dark:text-green-400">
                {total.toFixed(2)} TK
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Supplier Information (unchanged) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Toolbar title="Supplier Information">
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next <span className="ml-1">→</span>
            </Button>
          </Toolbar>
          <div className="grid grid-cols-2 gap-3 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier *
              </label>
              <Dropdown
                value={selectedSupplier}
                options={suppliers}
                onChange={(e) => setSelectedSupplier(e.value)}
                optionLabel="name"
                placeholder="Select Supplier"
                className="w-full"
                showClear
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock In Date
              </label>
              <Calendar
                value={stockInDate}
                onChange={(e) => setStockInDate(e.value as Date)}
                showIcon
                className="w-full border-b border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ----- Batch Selection Modal (NEW) ----- */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Select Price Set"
        size="xl"
      >
        <div className="p-1">
          <div className="table-container">
            <DataTable value={selectedVariantStocks} size="small" stripedRows>
              <Column
                field="batchNo"
                header="Batch"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="buyingPrice"
                header="Buying Price"
                body={(row) => `${row.buyingPrice} TK`}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="sellingPrice"
                header="Selling Price"
                body={(row) => `${row.sellingPrice} TK`}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Discount"
                body={(row) =>
                  formatDiscount(row.sellingPrice, row.discountPercent)
                }
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="currentQty"
                header="Current Qty"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Action"
                body={(row) => (
                  <Button
                    size="small"
                    variant="primary"
                    onClick={() => addOrIncrementStock(row)}
                  >
                    Select
                  </Button>
                )}
                style={{ width: "100px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
            </DataTable>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal (unchanged) */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Stock In"
        size="xl"
      >
        <div className="p-1 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-[14px]">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              Stock In Details
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Supplier: {selectedSupplier?.name}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Date: {stockInDate.toLocaleDateString()}
            </p>
          </div>

          <div className="table-container">
            <DataTable value={items} size="small">
              <Column
                field="productName"
                header="Product"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="sku"
                header="SKU"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="quantity"
                header="Qty"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="total"
                header="Line Total"
                body={(row) => `${row.total.toFixed(2)} TK`}
                headerClassName="column-header"
                bodyClassName="column-body"
                footer={() => (
                  <div className="font-bold text-gray-800 dark:text-gray-200 flex text-[13px] ml-[-30px]">
                    <span className="mr-2">Total:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {total.toFixed(2)} TK
                    </span>
                  </div>
                )}
              />
            </DataTable>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirm}>
              Confirm Stock In
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StockIn;
