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

// ---------- Thumbnails ----------
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

// ---------- Helpers ----------
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

  // Sorting state
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Load suppliers on mount
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

  // Add item to stock-in list
  const addItemToStockIn = useCallback(
    (stock: FlatStockItem) => {
      if (stockInItems.some((item) => item.stockId === stock.id)) {
        toast.info("Item already added");
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
      setStockInItems((prev) => [...prev, newItem]);
    },
    [stockInItems],
  );

  // Update quantity in stock-in table
  const updateQuantity = useCallback((stockId: number, newQty: number) => {
    setStockInItems((prev) =>
      prev.map((item) => {
        if (item.stockId !== stockId) return item;
        const qty = Math.max(1, newQty);
        return {
          ...item,
          quantity: qty,
          total: item.buyingPrice * qty,
        };
      }),
    );
  }, []);

  const removeItem = useCallback((stockId: number) => {
    setStockInItems((prev) => prev.filter((item) => item.stockId !== stockId));
  }, []);

  const clearAllItems = useCallback(() => {
    if (stockInItems.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setStockInItems([]);
    toast.success("All items cleared.");
  }, [stockInItems]);

  // Totals
  const totalItems = stockInItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = stockInItems.reduce((sum, i) => sum + i.total, 0);
  const total = subtotal;

  // Validation
  const isFormValid = useCallback(() => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return false;
    }
    if (stockInItems.length === 0) {
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
    const payload = {
      supplierId: selectedSupplier!.id,
      supplierName: selectedSupplier!.name,
      stockInDate: stockInDate.toISOString(),
      items: stockInItems.map((item) => ({
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
      const errors = result.error.errors.map((e) => e.message).join(", ");
      toast.error(`Validation failed: ${errors}`);
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
          onClick={() => addItemToStockIn(row)}
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

  // ---------- Right Stock-In Table Templates ----------
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
        key={JSON.stringify(stockInItems)}
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

      {/* Right – Stock In */}
      <div className="flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[550px] overflow-scroll">
          <Toolbar title="Stock In">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Dropdown
                  value={selectedSupplier}
                  options={suppliers}
                  onChange={(e) => setSelectedSupplier(e.value)}
                  optionLabel="name"
                  placeholder="Select Supplier"
                  className="w-48"
                  showClear
                />
                <Calendar
                  value={stockInDate}
                  onChange={(e) => setStockInDate(e.value as Date)}
                  showIcon
                  className="w-40"
                />
              </div>
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
              value={stockInItems}
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
                header="Unit Price"
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

        {/* Next Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            Next <span className="ml-1">→</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
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
            <DataTable value={stockInItems} size="small">
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

          {/* Footer buttons */}
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
