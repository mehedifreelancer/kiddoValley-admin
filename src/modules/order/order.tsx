import { ArrowUpDown, Delete, Plus, Trash2 } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputNumber } from "primereact/inputnumber";
import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { useEmailNotification } from "../../hooks/useEmailNotification";
import { parseWithGroq } from "../geminie/groq.service";
import { StockTable, StockTableColumn } from "../stock/StockTable";
import { getStockList } from "../stock/stock.service";
import { FlatStockItem } from "../stock/stock.types";
import { orderPayloadSchema } from "./order.schems";
import {
  checkCustomerExists,
  confirmAndPack,
  createOrder,
} from "./order.service";
import { CreateOrderPayload, OrderItem } from "./order.types";

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
const formatProfit = (sellingPrice: number, buyingPrice: number) => {
  const profit = sellingPrice - buyingPrice;
  const percent = (profit / sellingPrice) * 100;
  return `${profit.toFixed(2)} TK (${percent.toFixed(1)}%)`;
};

// ---------- Helper function ----------
const usePathao = () => {
  const createPathaoOrder = (orderData: any) => {
    console.log("Pathao order:", orderData);
    toast.info("Pathao integration (mock)");
  };
  return { createPathaoOrder };
};

// ---------- Print receipt helper ----------
const handlePrintReceipt = (order: any) => {
  console.log("Print receipt for order:", order.invoiceNo);
  toast.info("Printing receipt (mock)");
};

// ---------- Main Component ----------
export const Order: React.FC = () => {
  // Customer form
  const [accountName, setAccountName] = useState(""); // NEW: Account holder name
  const [recipientName, setRecipientName] = useState(""); // Parcel receiver name
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhone2, setCustomerPhone2] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [hasBaby, setHasBaby] = useState<boolean | undefined>(undefined);
  const [preferredToy, setPreferredToy] = useState<string | undefined>("");
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());

  const [customerExists, setCustomerExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const phoneCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // ----- State -----
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [allStockItems, setAllStockItems] = useState<FlatStockItem[]>([]);
  const [reservedQuantities, setReservedQuantities] = useState<
    Record<number, number>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [rawText, setRawText] = useState("");
  const [selectedVariantStocks, setSelectedVariantStocks] = useState<
    FlatStockItem[]
  >([]);
  const [socialAccountName, setSocialAccountName] = useState(""); // AI modal field

  // Email hook
  const { sendEmail } = useEmailNotification({
    defaultTo: "mehediaiyub451@gmail.com",
    defaultSubject: "New Order Notification",
  });

  const { createPathaoOrder } = usePathao();

  // Sorting state
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ---------- Customer check ----------
  const checkCustomer = async (phone: string) => {
    if (!phone || phone.length < 11) {
      setCustomerExists(null);
      return;
    }
    setChecking(true);
    try {
      const exists = await checkCustomerExists(phone);
      setCustomerExists(exists);
    } catch {
      setCustomerExists(null);
    } finally {
      setChecking(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (phoneCheckTimeout.current) clearTimeout(phoneCheckTimeout.current);
    phoneCheckTimeout.current = setTimeout(() => {
      checkCustomer(value);
    }, 500);
  };

  // ---------- Functions ----------
  const getAvailableQty = (stock: FlatStockItem) => {
    const reserved = reservedQuantities[stock.id] || 0;
    return stock.currentQty - reserved;
  };

  const updateQuantity = (stockId: number, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.stockId !== stockId) return item;
        const stock = allStockItems.find((s) => s.id === stockId);
        if (!stock) return item;
        const reserved = reservedQuantities[stockId] || 0;
        const maxAvailable = stock.currentQty - reserved + item.quantity;
        const qty = Math.min(Math.max(1, newQty), maxAvailable);
        if (qty !== newQty && newQty > qty) {
          toast.warn(`Only ${maxAvailable} units available`);
        }
        const delta = qty - item.quantity;
        setReservedQuantities((prevRes) => ({
          ...prevRes,
          [stockId]: (prevRes[stockId] || 0) + delta,
        }));
        const total = item.sellingPrice * qty;
        const discountAmount =
          ((item.sellingPrice * item.discountPercent) / 100) * qty;
        const finalPrice = total - discountAmount;
        const profitTk = (item.sellingPrice - item.buyingPrice) * qty;
        return {
          ...item,
          quantity: qty,
          total,
          discountAmount,
          finalPrice,
          profitTk,
        };
      }),
    );
  };

  const addItemToOrder = (stock: FlatStockItem) => {
    const available = getAvailableQty(stock);
    if (available <= 0) {
      toast.error(
        `"${stock.variant.productName}" is out of stock (${available} available)`,
      );
      return;
    }
    const discountPerUnit = (stock.sellingPrice * stock.discountPercent) / 100;
    const profitTkPerUnit = stock.sellingPrice - stock.buyingPrice;
    const profitPercent = (profitTkPerUnit / stock.sellingPrice) * 100;
    const newItem: OrderItem = {
      stockId: stock.id,
      batchNo: stock.batchNo,
      productName: stock.variant.productName,
      sku: stock.variant.sku,
      buyingPrice: stock.buyingPrice,
      sellingPrice: stock.sellingPrice,
      discountPercent: stock.discountPercent,
      quantity: 1,
      maxQuantity: stock.currentQty,
      total: stock.sellingPrice,
      discountAmount: discountPerUnit,
      finalPrice: stock.sellingPrice - discountPerUnit,
      profitTk: profitTkPerUnit,
      profitPercent,
    };
    setOrderItems((prev) => [...prev, newItem]);
    setReservedQuantities((prev) => ({
      ...prev,
      [stock.id]: (prev[stock.id] || 0) + 1,
    }));
  };

  const increaseQuantity = (stockId: number) => {
    const item = orderItems.find((i) => i.stockId === stockId);
    if (!item) {
      toast.error("Item not found in order");
      return;
    }
    const stock = allStockItems.find((s) => s.id === stockId);
    if (!stock) return;
    const reserved = reservedQuantities[stockId] || 0;
    const maxAllowed = stock.currentQty - reserved + item.quantity;
    const newQty = Math.min(item.quantity + 1, maxAllowed);
    if (newQty === item.quantity) {
      toast.info(`Max quantity (${maxAllowed}) reached`);
      return;
    }
    updateQuantity(stockId, newQty);
  };

  const addOrIncrementStock = (stock: FlatStockItem) => {
    const existing = orderItems.find((item) => item.stockId === stock.id);
    if (existing) {
      increaseQuantity(stock.id);
    } else {
      addItemToOrder(stock);
    }
  };

  const removeItem = (stockId: number) => {
    const item = orderItems.find((i) => i.stockId === stockId);
    if (item) {
      setReservedQuantities((prev) => ({
        ...prev,
        [stockId]: Math.max(0, (prev[stockId] || 0) - item.quantity),
      }));
    }
    setOrderItems((prev) => prev.filter((item) => item.stockId !== stockId));
  };

  const clearAllItems = () => {
    if (orderItems.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setReservedQuantities({});
    setOrderItems([]);
    toast.success("All items cleared.");
  };

  const handleAddToOrder = (stock: FlatStockItem) => {
    const available = getAvailableQty(stock);
    if (available <= 0) {
      toast.error(
        `"${stock.variant.productName}" is out of stock (${available} available)`,
      );
      return;
    }
    const existing = orderItems.find((item) => item.stockId === stock.id);
    if (existing) {
      increaseQuantity(stock.id);
      return;
    }
    const variantBatches = allStockItems.filter(
      (s) => s.variant.id === stock.variant.id && getAvailableQty(s) > 0,
    );
    if (variantBatches.length > 1) {
      setSelectedVariantStocks(variantBatches);
      setShowBatchModal(true);
    } else {
      addItemToOrder(stock);
    }
  };

  useBarcodeScanner({
    inputRef: searchInputRef,
    onSearchChange: setSearchTerm,
    onBarcodeScanned: async (barcode) => {
      try {
        const response = await getStockList(
          1,
          1000,
          barcode,
          "currentQty",
          "asc",
          false,
        );
        const stocks = response.data;
        if (stocks.length === 0) {
          toast.error(`Barcode "${barcode}" not found`);
          return;
        }
        const stock = stocks[0];
        const available = getAvailableQty(stock);
        if (available <= 0) {
          toast.error(
            `"${stock.variant.productName}" is out of stock (${available} available)`,
          );
          return;
        }
        const existing = orderItems.find((item) => item.stockId === stock.id);
        if (existing) {
          increaseQuantity(stock.id);
        } else {
          handleAddToOrder(stock);
        }
      } catch (error) {
        console.error("Barcode scan error:", error);
        toast.error("Error searching barcode");
      }
    },
    onClear: () => console.log("Input cleared"),
  });

  const handleStockDataChange = (data: FlatStockItem[]) => {
    setAllStockItems(data);
  };

  const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalDiscount = orderItems.reduce(
    (sum, i) => sum + i.discountAmount,
    0,
  );
  const totalBill = orderItems.reduce((sum, i) => sum + i.finalPrice, 0);

  const isCustomerFormValid = () =>
    accountName.trim() !== "" &&
    recipientName.trim() !== "" &&
    customerPhone.trim() !== "" &&
    customerAddress.trim() !== "";

  const handleNext = () => {
    if (!isCustomerFormValid()) {
      toast.error(
        "Please fill in account name, recipient name, phone, and address",
      );
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setShowConfirmModal(true);
  };

  const buildPayload = (): CreateOrderPayload => ({
    customerName: recipientName, // recipient name for order
    accountName, // account holder name for CustomerInfo
    customerPhone,
    customerPhone2,
    customerAddress,
    gender,
    hasBaby,
    preferredToy,
    deliveryDate: deliveryDate.toISOString(),
    items: orderItems.map((item) => ({
      stockId: item.stockId,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
      totalPrice: item.total,
    })),
    subtotal: orderItems.reduce((sum, i) => sum + i.total, 0),
    discountTotal: totalDiscount,
    total: totalBill,
  });

  const handleConfirmOnly = async () => {
    const payload = buildPayload();
    const result = orderPayloadSchema.safeParse(payload);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(", ");
      toast.error(`Validation failed: ${errors}`);
      return;
    }
    try {
      await createOrder(payload);
      toast.success("Order confirmed!");
      await sendEmail(undefined, undefined, undefined, {
        customerName: recipientName,
        total: totalBill.toFixed(2),
        items: orderItems,
        customerPhone,
        customerAddress,
      });
      setOrderItems([]);
      setReservedQuantities({});
      setAccountName("");
      setRecipientName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setGender(undefined);
      setHasBaby(undefined);
      setPreferredToy("");
      setDeliveryDate(new Date());
      setShowConfirmModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to confirm order");
    }
  };

  const handleConfirmAndPack = async () => {
    const payload = buildPayload();
    const result = orderPayloadSchema.safeParse(payload);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(", ");
      toast.error(`Validation failed: ${errors}`);
      return;
    }
    try {
      const response = await confirmAndPack(payload);
      toast.success("Order confirmed and packed!");
      handlePrintReceipt(response.data);
      setOrderItems([]);
      setReservedQuantities({});
      setAccountName("");
      setRecipientName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setGender(undefined);
      setHasBaby(undefined);
      setPreferredToy("");
      setDeliveryDate(new Date());
      setShowConfirmModal(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to confirm and pack order",
      );
    }
  };

  // ---------- AI Fillup handler ----------
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAIFillup = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste some customer text first");
      return;
    }
    setLoadingAI(true);
    try {
      // 1. Reset all fields
      setAccountName("");
      setRecipientName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setGender(undefined);
      setHasBaby(undefined);
      setPreferredToy("");

      // 2. Parse with Groq
      const parsed = await parseWithGroq(rawText);
      console.log("parsed", parsed);

      // 3. Determine names
      let finalAccountName = parsed.accountName || parsed.recipientName || "";
      let finalRecipientName = parsed.recipientName || parsed.accountName || "";

      // If socialAccountName is provided, it overrides accountName
      if (socialAccountName.trim()) {
        finalAccountName = socialAccountName.trim();
        // If no recipient name was found, set it to account name
        if (!finalRecipientName) {
          finalRecipientName = finalAccountName;
        }
      }

      // If only one name exists (or if recipient name is empty), use account name for both
      if (!finalRecipientName) {
        finalRecipientName = finalAccountName;
      }

      // If account name is empty but recipient name exists, use recipient name for account
      if (!finalAccountName && finalRecipientName) {
        finalAccountName = finalRecipientName;
      }

      setAccountName(finalAccountName);
      setRecipientName(finalRecipientName);
      setGender(parsed.gender || "");

      if (parsed.recipientPhone) setCustomerPhone(parsed.recipientPhone);
      if (parsed.recipientPhone2) setCustomerPhone2(parsed.recipientPhone2);
      if (parsed.recipientAddress) setCustomerAddress(parsed.recipientAddress);
      if (parsed.hasBaby !== undefined) setHasBaby(parsed.hasBaby);
      if (parsed.preferredToy) setPreferredToy(parsed.preferredToy);

      setShowAIModal(false);
      setRawText("");
      setSocialAccountName("");
      toast.success("Customer info filled from AI!");
    } catch (error: any) {
      console.error("AI Fillup error:", error);
      toast.error(error.message || "Failed to parse customer text");
    } finally {
      setLoadingAI(false);
    }
  };
  // ---------- Stock Table Columns ----------
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
      header: "Available Qty",
      sortable: true,
      body: (row) => {
        const available = getAvailableQty(row);
        return (
          <span
            className={
              available < 6
                ? "text-red-600 font-semibold"
                : "text-gray-800 dark:text-gray-200"
            }
          >
            {available}
          </span>
        );
      },
    },
    {
      header: "Action",
      body: (row) => {
        const available = getAvailableQty(row);
        return (
          <Button
            size="small"
            variant="outline"
            onClick={() => handleAddToOrder(row)}
            className="flex items-center gap-1 p-button-sm"
            disabled={available <= 0}
          >
            <Plus className="w-4 h-4" />
            Select
          </Button>
        );
      },
      style: { width: "110px" },
    },
  ];

  const rowClassName = (row: FlatStockItem) => {
    const available = getAvailableQty(row);
    return available < 6 ? "bg-red-900/50! text-white table-row" : "table-row";
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

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

  // ---------- Order Table Templates ----------
  const orderProductBody = (row: OrderItem) => (
    <div>
      <div className="font-medium text-gray-800 dark:text-gray-200">
        {row.productName}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</div>
    </div>
  );
  const orderProfitBody = (row: OrderItem) => (
    <span className="text-gray-700 dark:text-gray-300">
      {formatProfit(row.sellingPrice, row.buyingPrice)}
    </span>
  );
  const orderDiscountBody = (row: OrderItem) => (
    <span className="text-gray-700 dark:text-gray-300">
      {formatDiscount(row.sellingPrice, row.discountPercent)}
    </span>
  );
  const orderQuantityBody = (row: OrderItem) => (
    <InputNumber
      value={row.quantity}
      onValueChange={(e) => updateQuantity(row.stockId, e.value || 1)}
      min={1}
      max={row.maxQuantity}
      size={2}
      className="w-20"
    />
  );
  const orderLineTotalBody = (row: OrderItem) => (
    <span className="font-semibold text-gray-800 dark:text-gray-200">
      {row.finalPrice.toFixed(2)} TK
    </span>
  );
  const orderActionsBody = (row: OrderItem) => (
    <Button
      size="small"
      variant="danger"
      onClick={() => removeItem(row.stockId)}
      className="p-button-sm flex items-center gap-1"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );

  const batchSelectBody = (batch: FlatStockItem) => (
    <Button
      size="small"
      variant="primary"
      onClick={() => {
        addOrIncrementStock(batch);
        setShowBatchModal(false);
      }}
    >
      Select
    </Button>
  );

  // ---------- Render ----------
  const reservedKey = JSON.stringify(reservedQuantities);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
      <StockTable
        key={reservedKey}
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

      {/* Right Column – Current Order */}
      <div className="flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[550px] overflow-scroll">
          <Toolbar title="Current Order">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
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
              value={orderItems}
              emptyMessage="No items added yet"
              size="small"
              className="w-full"
              stripedRows
            >
              <Column
                header="Product"
                body={orderProductBody}
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
                header="Profit Margin"
                body={orderProfitBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Discount"
                body={orderDiscountBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Qty"
                body={orderQuantityBody}
                style={{ width: "100px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Line Total"
                body={orderLineTotalBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Actions"
                body={orderActionsBody}
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
                Total Discount:
              </span>
              <span className="font-semibold text-red-600">
                {totalDiscount.toFixed(2)} TK
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-1">
              <span className="text-gray-800 dark:text-gray-200">
                Total Bill:
              </span>
              <span className="text-green-600 dark:text-green-400">
                {totalBill.toFixed(2)} TK
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Toolbar title="Customer Information">
            <div className="flex items-center gap-2">
              {customerExists !== null && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    customerExists
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                >
                  {customerExists ? "Returning" : "New"}
                </span>
              )}
              {checking && (
                <span className="text-xs text-gray-400">Checking...</span>
              )}
              <div className="flex-1"></div>
              <Button variant="outline" onClick={() => setShowAIModal(true)}>
                AI Fillup
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next <span className="ml-1">→</span>
              </Button>
            </div>
          </Toolbar>
          <div className="grid grid-cols-2 gap-3 p-4">
            <div>
              <InputField
                label="Recipient Name *"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone *{" "}
                {customerExists !== null && (
                  <span
                    className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      customerExists
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                  >
                    {customerExists ? "Returning" : "New"}
                  </span>
                )}
                {checking && (
                  <span className="ml-2 text-xs text-gray-400">
                    Checking...
                  </span>
                )}
              </label>
              <InputField
                value={customerPhone}
                onChange={(e: any) => handlePhoneChange(e.target.value)}
                placeholder="Enter phone number"
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Secondary Phone"
                value={customerPhone2}
                onChange={(e) => setCustomerPhone2(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Date
              </label>
              <Calendar
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.value as Date)}
                className="w-full border-b border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600
 "
                showIcon
              />
            </div>
            <div className="col-span-2">
              <InputField
                label="Address *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Account Name *"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Gender *"
                value={accountName} // ← wrong value, should be gender
                onChange={(e) => setAccountName(e.target.value)} // ← wrong setter
                required
                className="w-full"
              />
            </div>
            {/* Gender, Has Baby, Preferred Toy are hidden – they may be set by AI but not shown */}
          </div>
        </div>
      </div>

      {/* Batch Modal */}
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
                field="sellingPrice"
                header="MRP"
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
                header="Available Qty"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Action"
                body={batchSelectBody}
                style={{ width: "100px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
            </DataTable>
          </div>
        </div>
      </Modal>

      {/* AI Fillup Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setRawText("");
          setSocialAccountName("");
        }}
        title="AI Customer Info Fillup"
        size="md"
      >
        <div className="p-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Paste the customer info text (e.g., from Messenger) below. The AI
            will parse it.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={6}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
            placeholder="e.g.&#10;রিজুয়ান&#10;01634857120&#10;01814950154&#10;কাদিরাবাদ ক্যান্টনমেন্ট স্যাপার কলেজ&#10;দয়ারামপুর,নাটোর"
          />
          <div className="mt-4">
            <InputField
              label="Social Account Name (optional)"
              value={socialAccountName}
              onChange={(e) => setSocialAccountName(e.target.value)}
              placeholder="Enter the account holder's name"
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, this name will be used as the account holder.
              Otherwise, the recipient name will be used.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowAIModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAIFillup}
              disabled={loadingAI}
            >
              {loadingAI ? "Loading..." : "Fill & Close"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Order"
        size="xl"
      >
        <div className="p-1 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-[14px]">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              Customer Details
              {customerExists !== null && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    customerExists
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                >
                  {customerExists ? "Returning" : "New"}
                </span>
              )}
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Account Holder: {accountName}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Recipient: {recipientName}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Phone: {customerPhone}
            </p>
            {customerPhone2 && (
              <p className="text-gray-600 dark:text-gray-300">
                Alt Phone: {customerPhone2}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-300">
              Address: {customerAddress}
            </p>
            {gender && (
              <p className="text-gray-600 dark:text-gray-300">
                Gender: {gender}
              </p>
            )}
            {hasBaby !== undefined && (
              <p className="text-gray-600 dark:text-gray-300">
                Has Baby: {hasBaby ? "Yes" : "No"}
              </p>
            )}
            {preferredToy && (
              <p className="text-gray-600 dark:text-gray-300">
                Preferred Toy: {preferredToy}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-300">
              Delivery Date: {deliveryDate.toLocaleDateString()}
            </p>
          </div>

          {/* Order Items Table */}
          <div className="table-container">
            <DataTable rowClassName="table-row" value={orderItems} size="small">
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
                field="finalPrice"
                header="Selling Price"
                body={(row) => `${row.finalPrice.toFixed(2)} TK`}
                headerClassName="column-header"
                bodyClassName="column-body"
                footer={() => (
                  <div className="font-bold text-gray-800 dark:text-gray-200 flex text-[13px] ml-[-30px]">
                    <span className="mr-2">Total:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {totalBill.toFixed(2)} TK
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
            <Button variant="success" onClick={handleConfirmOnly}>
              Confirm Order
            </Button>
            <Button variant="primary" onClick={handleConfirmAndPack}>
              Confirm & Pack
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Order;
