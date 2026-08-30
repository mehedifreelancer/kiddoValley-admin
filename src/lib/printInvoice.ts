import { generateBarcodeMarkup } from "./BarcodeDraw"; // 👈 path adjust করুন

// ---------- Shared print window opener ----------
// Waits for the print window to actually finish loading/laying out before
// calling print() — calling print() immediately after document.write()/
// close() races the browser's layout pass, which can cause content to be
// cropped or missing on the physical printout.
export const openAndPrintHtml = (html: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Caller decides how to surface this (toast, etc) — keep this file
    // free of UI-library dependencies.
    console.error("Popup blocked: could not open print window");
    return false;
  }

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
  return true;
};

// ---------- Invoice receipt shape ----------
// Minimal shape both OrderList's OrderItem and Order.tsx's freshly-created
// order response need to satisfy. Extra fields on the actual objects are
// fine — this is structural, not exact.
export interface PrintableSoldItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PrintableOrder {
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string | Date;
  total: number;
  deliveryCharge?: number | null;
  soldItems?: PrintableSoldItem[];
}

/**
 * Single source of truth for the 3x4in invoice receipt layout. Used by both
 * OrderList's Reprint/Details-modal print buttons and Order.tsx's
 * "Confirm, Book & Print" flow, so both always print the exact same
 * receipt design.
 */
export const printInvoiceReceipt = (order: PrintableOrder): boolean => {
  let invoiceBarcodeSVG = "";
  try {
    invoiceBarcodeSVG = generateBarcodeMarkup(order.invoiceNo, {
      heightPx: 35,
      fontSize: 9,
    });
  } catch (err) {
    console.error("Failed to generate invoice barcode:", err);
  }

  const itemsHtml =
    order.soldItems
      ?.map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.unitPrice.toFixed(2)}</td>
        <td>${item.totalPrice.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("") || "";

  const logoUrl = `${window.location.origin}/logo/logo.jpg`;

  const deliveryChargeHtml =
    order.deliveryCharge !== undefined && order.deliveryCharge !== null
      ? `<p class="charge-line">Delivery Charge: <span>${order.deliveryCharge.toFixed(2)} TK</span></p>`
      : "";

  const html = `
    <html>
      <head>
        <title>Invoice #${order.invoiceNo}</title>
        <style>
          @page { size: 3in 4in; margin: 0.1in; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }

          html {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 16px;
            padding: 0.05in 0.1in 0.1in;
            width: 100%;
            color: #000;
            font-weight: 600;
            -webkit-font-smoothing: none;
            text-rendering: geometricPrecision;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-top: 0;
          }
          .header .logo {
            width: 150px;
            height: auto;
            object-fit: contain;
            filter: contrast(1.3) saturate(1.15) brightness(0.95);
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .header .invoice-barcode {
            display: flex;
            align-items: center;
          }
          .header .invoice-barcode svg {
            display: block;
          }

          .info { margin: 6px 0; }
          .info p { margin: 3px 0; font-size: 14px; font-weight: 600; color: #000; word-break: break-word; }

          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th {
            background: #fff;
            color: #000;
            text-align: left;
            padding: 5px;
            font-size: 13px;
            font-weight: 700;
            border-bottom: 2px solid #000;
          }
          td { padding: 5px; border-bottom: 1px solid #000; font-size: 14px; font-weight: 600; color: #000; }

          .summary { margin-top: 8px; text-align: right; }
          .summary .charge-line { margin: 3px 0; font-size: 14px; font-weight: 600; color: #000; }
          .total { text-align: right; margin-top: 6px; font-size: 18px; font-weight: 900; color: #000; }
          .footer { text-align: center; border-top: 2px solid #000; padding-top: 6px; margin-top: 6px; font-size: 12px; font-weight: 600; color: #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <img class="logo" src="${logoUrl}" alt="KiddoValley" />
          <div class="invoice-barcode">${invoiceBarcodeSVG}</div>
        </div>
        <div class="info">
          <p><strong>${order.customerName}</strong></p>
          <p>${order.customerPhone}</p>
          <p>${order.customerAddress}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="summary">
          ${deliveryChargeHtml}
        </div>
        <div class="total">Total: ${order.total.toFixed(2)} TK</div>
        <div class="footer">Thank you!</div>
      </body>
    </html>
  `;

  return openAndPrintHtml(html);
};
