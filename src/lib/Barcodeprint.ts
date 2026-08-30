import { generateBarcodeMarkupForLabel } from "./BarcodeDraw"; // 👈 path adjust করুন

export interface LabelSize {
  label: string;
  width: number;
  height: number;
}

export const LABEL_SIZES: LabelSize[] = [
  { label: "38mm x 25mm", width: 38, height: 25 },
];

// 👇 Sticker-specific naming kept for backward compatibility — just a thin
// wrapper over the shared drawing utility now.
export const generateBarcodeSVGMarkup = (
  value: string,
  labelHeightMm: number,
): string => generateBarcodeMarkupForLabel(value, labelHeightMm);

export interface BuildStickerPrintHtmlParams {
  sku: string;
  barcode: string;
  size: LabelSize;
  count: number;
  horizontal?: boolean;
}

export const buildStickerPrintHtml = ({
  sku,
  barcode,
  size,
  count,
  horizontal = false,
}: BuildStickerPrintHtmlParams): string => {
  const barcodeSVG = generateBarcodeSVGMarkup(barcode, size.height);

  const stickerMarkup = horizontal
    ? `
      <div class="sticker">
        <div class="sticker-rotate-wrap">
          <div class="sticker-sku">${sku}</div>
          <div class="sticker-barcode">${barcodeSVG}</div>
        </div>
      </div>
    `
    : `
      <div class="sticker">
        <div class="sticker-sku">${sku}</div>
        <div class="sticker-barcode">${barcodeSVG}</div>
      </div>
    `;

  const allStickers = Array.from({ length: count }, () => stickerMarkup).join(
    "",
  );

  return `
    <html>
      <head>
        <title>Print Thermal Labels</title>
        <style>
          @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .sticker {
            position: relative;
            width: ${size.width}mm;
            height: ${size.height}mm;
            page-break-after: always;
            overflow: hidden;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .sticker-rotate-wrap {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(90deg);
            transform-origin: center center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: ${size.height}mm;
            height: ${size.width}mm;
          }
          .sticker-sku {
            font-size: 9px;
            font-weight: 700;
            font-family: monospace;
            letter-spacing: 0.5px;
            white-space: nowrap;
            margin-bottom: 1mm;
            flex-shrink: 0;
          }
          .sticker-barcode {
            flex: 1 1 auto;
            min-height: 0;
            min-width: 0;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .sticker-barcode svg {
            display: block;
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        ${allStickers}
      </body>
    </html>
  `;
};
