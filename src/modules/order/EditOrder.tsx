"use client";

import { ArrowUpDown, Delete, Plus, Save, Trash2 } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputNumber } from "primereact/inputnumber";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { parseWithGroq } from "../geminie/groq.service";
import { StockTable, StockTableColumn } from "../stock/StockTable";
import { getStockList } from "../stock/stock.service";
import { FlatStockItem } from "../stock/stock.types";
import {
  checkCustomerExists,
  getOrderDetails,
  updateOrder,
} from "./order.service";
import { OrderItem } from "./order.types";

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

// ---------- Main Component ----------
const EditOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  // Customer form
  const [accountName, setAccountName] = useState("");
  const [recipientName, setRecipientName] = useState("");
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

  // Order items state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [allStockItems, setAllStockItems] = useState<FlatStockItem[]>([]);
  const [reservedQuantities, setReservedQuantities] = useState<
    Record<number, number>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [rawText, setRawText] = useState("");
  const [selectedVariantStocks, setSelectedVariantStocks] = useState<
    FlatStockItem[]
  >([]);
  const [socialAccountName, setSocialAccountName] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ---------- Load Order Data ----------
  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const result = await getOrderDetails(Number(id));
      const data = result.data;
      setOrderData(data);
      const newStatus = data.orderStatus === "new";
      setIsNew(newStatus);

      setAccountName(data.customerName || "");
      setRecipientName(data.customerName || "");
      setCustomerPhone(data.customerPhone || "");
      setCustomerPhone2(data.customerPhone2 || "");
      setCustomerAddress(data.customerAddress || "");
      setGender(data.gender || undefined);
      setHasBaby(data.hasBaby ?? undefined);
      setPreferredToy(data.preferredToy || "");
      setDeliveryDate(
        data.deliveryDate ? new Date(data.deliveryDate) : new Date(),
      );

      if (data.soldItems && data.soldItems.length > 0) {
        const items: OrderItem[] = data.soldItems.map((item: any) => ({
          stockId: item.stockId || 0,
          batchNo: "N/A",
          productName: item.productName,
          sku: item.variantSku,
          buyingPrice: 0,
          sellingPrice: item.unitPrice,
          discountPercent: 0,
          quantity: item.quantity,
          maxQuantity: item.quantity, // temporary, updated later
          total: item.totalPrice,
          discountAmount: 0,
          finalPrice: item.totalPrice,
          profitTk: 0,
          profitPercent: 0,
        }));
        setOrderItems(items);
        const reserved: Record<number, number> = {};
        items.forEach((item) => {
          reserved[item.stockId] = item.quantity;
        });
        setReservedQuantities(reserved);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load order");
      navigate("/order-list");
    } finally {
      setLoading(false);
    }
  };

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

  // ---------- Order item functions (with fallback) ----------
  const getAvailableQty = (stock: FlatStockItem) => {
    const reserved = reservedQuantities[stock.id] || 0;
    return stock.currentQty - reserved;
  };

  // updateQuantity with fallback
  const updateQuantity = (stockId: number, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.stockId !== stockId) return item;
        const stock = allStockItems.find((s) => s.id === stockId);
        const currentQty = stock ? stock.currentQty : item.maxQuantity;
        const reserved = reservedQuantities[stockId] || 0;
        const maxAvailable = currentQty - reserved + item.quantity;
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

  const increaseQuantity = (stockId: number) => {
    if (!isNew) {
      toast.error("Cannot modify items in a non-editable order");
      return;
    }
    const item = orderItems.find((i) => i.stockId === stockId);
    if (!item) {
      toast.error("Item not found in order");
      return;
    }
    const stock = allStockItems.find((s) => s.id === stockId);
    const currentQty = stock ? stock.currentQty : item.maxQuantity;
    const reserved = reservedQuantities[stockId] || 0;
    const maxAllowed = currentQty - reserved + item.quantity;
    const newQty = Math.min(item.quantity + 1, maxAllowed);
    if (newQty === item.quantity) {
      toast.info(`Max quantity (${maxAllowed}) reached`);
      return;
    }
    updateQuantity(stockId, newQty);
  };

  const addItemToOrder = (stock: FlatStockItem) => {
    if (!isNew) {
      toast.error("Cannot add items to a non-editable order");
      return;
    }
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

  const addOrIncrementStock = (stock: FlatStockItem) => {
    if (!isNew) {
      toast.error("Cannot modify items in a non-editable order");
      return;
    }
    const existing = orderItems.find((item) => item.stockId === stock.id);
    if (existing) {
      increaseQuantity(stock.id);
    } else {
      addItemToOrder(stock);
    }
  };

  const removeItem = (stockId: number) => {
    if (!isNew) {
      toast.error("Cannot remove items from a non-editable order");
      return;
    }
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
    if (!isNew) {
      toast.error("Cannot clear items from a non-editable order");
      return;
    }
    if (orderItems.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setReservedQuantities({});
    setOrderItems([]);
    toast.success("All items cleared.");
  };

  const handleAddToOrder = (stock: FlatStockItem) => {
    if (!isNew) {
      toast.error("Cannot modify items in a non-editable order");
      return;
    }
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
    setOrderItems((prev) =>
      prev.map((item) => {
        const stock = data.find((s) => s.id === item.stockId);
        if (stock) {
          return { ...item, maxQuantity: stock.currentQty };
        }
        return item;
      }),
    );
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

  // ---------- Save Handler ----------
  const performSave = async () => {
    if (!isNew) {
      toast.error("Only new orders can be edited");
      return false;
    }
    if (!isCustomerFormValid()) {
      toast.error(
        "Please fill in account name, recipient name, phone, and address",
      );
      return false;
    }
    if (orderItems.length === 0) {
      toast.error("Order must have at least one item");
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: recipientName,
        accountName,
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
      };

      await updateOrder(Number(id), payload);
      toast.success("Order updated successfully!");
      navigate("/order-list");
      return true;
    } catch (error: any) {
      if (
        error.response?.data?.message?.includes("not found") ||
        error.response?.data?.message?.includes("cancelled") ||
        error.response?.data?.message?.includes(
          "Only 'new' orders can be edited",
        )
      ) {
        toast.error(
          "Order is no longer editable. It may have been confirmed or cancelled.",
        );
        fetchOrder();
      } else {
        toast.error(error.response?.data?.message || "Update failed");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ---------- Next handler ----------
  const handleNext = () => {
    if (!isNew) {
      toast.error("Only new orders can be saved");
      return;
    }
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
    setShowEditConfirmModal(true);
  };

  // ---------- AI Fillup ----------
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAIFillup = async () => {
    if (!isNew) {
      toast.error("AI Fillup is only available for new orders");
      return;
    }
    if (!rawText.trim()) {
      toast.error("Please paste some customer text first");
      return;
    }
    setLoadingAI(true);
    try {
      setAccountName("");
      setRecipientName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setGender(undefined);
      setHasBaby(undefined);
      setPreferredToy("");

      const parsed = await parseWithGroq(rawText);
      console.log("parsed", parsed);

      let finalAccountName = parsed.accountName || parsed.recipientName || "";
      let finalRecipientName = parsed.recipientName || parsed.accountName || "";

      if (socialAccountName.trim()) {
        finalAccountName = socialAccountName.trim();
        if (!finalRecipientName) {
          finalRecipientName = finalAccountName;
        }
      }

      if (!finalRecipientName) {
        finalRecipientName = finalAccountName;
      }
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
            disabled={!isNew || available <= 0}
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
      disabled={!isNew}
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
      disabled={!isNew}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!orderData) {
    return <div>Order not found</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
      {/* Left – Stock Table */}
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
          <Toolbar title="Edit Order">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
                </span>
                {!isNew && (
                  <span className="text-xs text-red-500 font-medium">
                    (Read-only – order is {orderData.orderStatus})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="danger"
                  onClick={clearAllItems}
                  className="flex items-center gap-1"
                  disabled={!isNew}
                >
                  <Delete className="w-4 h-4" />
                  Clear
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={performSave}
                  disabled={!isNew || saving}
                  loading={saving}
                  className="flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
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
              <Button
                variant="outline"
                onClick={() => setShowAIModal(true)}
                disabled={!isNew}
              >
                AI Fillup
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex items-center gap-2"
                disabled={!isNew}
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
                disabled={!isNew}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone *{" "}
                {!isNew && (
                  <span className="text-xs text-red-500">(read-only)</span>
                )}
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
                disabled={!isNew}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Secondary Phone"
                value={customerPhone2}
                onChange={(e) => setCustomerPhone2(e.target.value)}
                disabled={!isNew}
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
                disabled={!isNew}
                className="w-full border-b border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                showIcon
              />
            </div>
            <div className="col-span-2">
              <InputField
                label="Address *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={!isNew}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Account Name *"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={!isNew}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Gender"
                value={gender || ""}
                onChange={(e) => setGender(e.target.value)}
                disabled={!isNew}
                className="w-full"
              />
            </div>
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
              disabled={loadingAI || !isNew}
            >
              {loadingAI ? "Loading..." : "Fill & Close"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Edit Confirmation Modal ===== */}
      <Modal
        isOpen={showEditConfirmModal}
        onClose={() => setShowEditConfirmModal(false)}
        title="Confirm Update"
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to update this order?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This will save all changes and you will be redirected to the order
            list.
          </p>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowEditConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditConfirmModal(false);
                navigate("/order-list");
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const success = await performSave();
                if (success) {
                  setShowEditConfirmModal(false);
                }
              }}
              loading={saving}
              disabled={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditOrder;
