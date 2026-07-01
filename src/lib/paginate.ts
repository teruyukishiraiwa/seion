import type { Note, Settings } from "../types";
import { FONT_STACKS } from "../constants";
import { cardGeometry } from "./cardGeometry";
import { getBodyHtml, toBlocks } from "./richText";
import { signatureMarginForCard, signatureWidthForCard } from "./signatureGeometry";

/** Shrink available heights slightly to absorb sub-pixel measurement drift. */
const SAFETY = 0.985;

function makeMeasurer(
  width: number,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacingEm: number,
  fontWeight = "400",
): HTMLDivElement {
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    width: `${width}px`,
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: String(lineHeight),
    letterSpacing: `${letterSpacingEm}em`,
    fontWeight,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    visibility: "hidden",
    boxSizing: "content-box",
    padding: "0",
    margin: "0",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(div);
  return div;
}

/**
 * Split a note's body into pages that each fit on one SNS card for the current
 * aspect ratio. The first page reserves room for the title. When
 * `settings.splitPages` is off, the whole body is returned as a single page.
 *
 * Requires a DOM (uses off-screen measurement); call from the browser only.
 */
export function paginateBody(note: Note | null, settings: Settings): string[] {
  const bodyHtml = getBodyHtml(note);
  if (!settings.splitPages) return [bodyHtml];

  const g = cardGeometry(settings.aspect);
  const font = FONT_STACKS[settings.font];

  // Height taken by the title block on the first page.
  const titleMeasurer = makeMeasurer(
    g.innerWidth,
    font,
    g.titleSize,
    g.titleLineHeight,
    g.titleLetterSpacing,
    "500",
  );
  titleMeasurer.textContent = note?.title || "無題";
  const titleH = titleMeasurer.offsetHeight + g.titleMarginBottom;
  titleMeasurer.remove();

  const firstLimit = (g.innerHeight - titleH) * SAFETY;
  const restLimit = g.innerHeight * SAFETY;

  // Each line is one `<div>...</div>` block; pages break between blocks.
  const blocks = toBlocks(bodyHtml);
  if (blocks.length === 0) return [""];

  // Measure each block's height once (block boxes stack independently).
  const measurer = makeMeasurer(
    g.innerWidth,
    font,
    g.bodySize,
    g.bodyLineHeight,
    g.bodyLetterSpacing,
  );
  const heights = blocks.map((b) => {
    measurer.innerHTML = b || "<br>";
    return measurer.offsetHeight;
  });
  if (settings.signatureEnabled && settings.signatureImage && heights.length > 0) {
    const ratio = Math.max(0.1, settings.signatureAspectRatio);
    heights[heights.length - 1] += signatureMarginForCard(settings) + signatureWidthForCard(settings) / ratio;
  }
  measurer.remove();

  const groups = partitionBlocks(heights, firstLimit, restLimit);
  return groups.map((idxs) => idxs.map((i) => blocks[i]).join(""));
}

/**
 * Group block indices into contiguous pages. Uses the fewest pages possible,
 * then balances line counts across them so the last page is not left with a
 * lone orphan line. Page 0 has less room (`firstLimit`) for the title.
 */
function partitionBlocks(
  heights: number[],
  firstLimit: number,
  restLimit: number,
): number[][] {
  const limitFor = (page: number, cap: number) =>
    Math.min(cap, page === 0 ? firstLimit : restLimit);

  // Greedily pack with a per-page height cap, returning the page groups.
  const pack = (cap: number): number[][] => {
    const pages: number[][] = [[]];
    let used = 0;
    for (let b = 0; b < heights.length; b++) {
      const p = pages.length - 1;
      if (pages[p].length === 0) {
        pages[p].push(b);
        used = heights[b];
      } else if (used + heights[b] <= limitFor(p, cap)) {
        pages[p].push(b);
        used += heights[b];
      } else {
        pages.push([b]);
        used = heights[b];
      }
    }
    return pages;
  };

  // Minimum number of pages (no extra cap beyond the real limits).
  const minPages = pack(Infinity).length;

  // Smallest uniform cap that still fits within `minPages` — evens out heights.
  const total = heights.reduce((a, b) => a + b, 0);
  const maxBlock = Math.max(...heights);
  let lo = maxBlock;
  let hi = Math.max(total, restLimit);
  for (let i = 0; i < 40 && hi - lo > 1; i++) {
    const mid = (lo + hi) / 2;
    if (pack(mid).length <= minPages) hi = mid;
    else lo = mid;
  }
  return pack(hi);
}
