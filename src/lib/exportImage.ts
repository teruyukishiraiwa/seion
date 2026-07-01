import { toSvg } from "html-to-image";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("背景の描画に失敗しました"));
    img.src = src;
  });
}

/**
 * Render a DOM node to a PNG and trigger a download.
 *
 * The node is expected to already be sized at the exact output dimensions
 * (e.g. 1080x1920). We serialise it to an SVG with html-to-image, then
 * rasterise it onto a canvas ourselves — html-to-image's own PNG path relies
 * on `img.decode()`, which can stall for large data-URI SVGs in some browsers.
 */
export async function exportNodeToPng(node: HTMLElement, filename: string) {
  const w = node.offsetWidth;
  const h = node.offsetHeight;

  // We rely entirely on OS fonts, so skip the web-font embedding step (it
  // needlessly fetches stylesheets and can stall the export).
  const svgDataUrl = await toSvg(node, {
    skipFonts: true,
    width: w,
    height: h,
    cacheBust: true,
  });

  const img = await loadImage(svgDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context を取得できませんでした");
  ctx.drawImage(img, 0, 0, w, h);

  const pngDataUrl = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.download = filename;
  link.href = pngDataUrl;
  link.click();
}

function baseName(title: string): string {
  return (
    title.trim().replace(/[\\/:*?"<>|]/g, "_").slice(0, 40) ||
    "seion"
  );
}

export function safeFilename(title: string, aspect: string): string {
  return `${baseName(title)}_${aspect.replace(":", "x")}.png`;
}

/** Filename for one page of a multi-page export, e.g. `title_9x16_2of3.png`. */
export function pageFilename(
  title: string,
  aspect: string,
  index: number,
  total: number,
): string {
  return `${baseName(title)}_${aspect.replace(":", "x")}_${index}of${total}.png`;
}
