import JsBarcode from "jsbarcode";

// ---------- Shared Barcode Drawing Utility ----------
// Single source of truth for JsBarcode calls across the app (sticker
// labels, invoice barcodes, modals, print HTML, etc). Anything that needs
// a barcode should go through one of the two functions below instead of
// calling JsBarcode directly, so all barcode styling options live in one
// place.

export interface BarcodeDrawOptions {
  format?: string;
  barWidth?: number;
  heightPx?: number;
  fontSize?: number;
  displayValue?: boolean;
  margin?: number;
}

const DEFAULT_OPTIONS: Required<BarcodeDrawOptions> = {
  format: "CODE128",
  barWidth: 1.3,
  heightPx: 35,
  fontSize: 10,
  displayValue: true,
  margin: 0,
};

/**
 * Draws a barcode directly into an already-mounted <svg> element (a React
 * ref, for example). Use this for barcodes rendered live inside the app —
 * e.g. a barcode shown inside a modal — since the SVG node already exists
 * in the DOM.
 */
export const drawBarcodeToElement = (
  svgEl: SVGSVGElement,
  value: string,
  options: BarcodeDrawOptions = {},
): void => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  JsBarcode(svgEl, value, {
    format: opts.format,
    width: opts.barWidth,
    height: opts.heightPx,
    fontSize: opts.fontSize,
    displayValue: opts.displayValue,
    margin: opts.margin,
  });
};

/**
 * Generates a barcode as a standalone SVG markup string, using a detached
 * (not-in-DOM) SVG node. Use this when building raw HTML for a print
 * window — e.g. window.open("")'d popups — where there's no live React
 * tree to mount a ref into, so JsBarcode has to run synchronously against
 * an off-DOM node and the result gets embedded as a string.
 */
export const generateBarcodeMarkup = (
  value: string,
  options: BarcodeDrawOptions = {},
): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svgEl, value, {
    format: opts.format,
    width: opts.barWidth,
    height: opts.heightPx,
    fontSize: opts.fontSize,
    displayValue: opts.displayValue,
    margin: opts.margin,
  });
  const svgWidth = svgEl.getAttribute("width");
  const svgHeight = svgEl.getAttribute("height");
  svgEl.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svgEl.outerHTML;
};

/**
 * mm-aware convenience wrapper — used by sticker labels where the caller
 * thinks in physical label height (mm) rather than raw pixels.
 */
const MM_TO_PX = 96 / 25.4; // ≈ 3.7795 px per mm at 96dpi

export const generateBarcodeMarkupForLabel = (
  value: string,
  labelHeightMm: number,
  options: BarcodeDrawOptions = {},
): string => {
  const heightPx = Math.max(labelHeightMm * 1.2 * MM_TO_PX, 22);
  return generateBarcodeMarkup(value, { heightPx, ...options });
};
