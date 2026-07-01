/**
 * Rich-text normalization and sanitization. Stored HTML is limited to the
 * inline formatting emitted by the editor.
 */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ALLOWED_TAGS = new Set(["DIV", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SPAN", "FONT"]);
const ALLOWED_STYLE_PROPERTIES = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-decoration-line",
]);

function sanitizeStyle(element: HTMLElement): void {
  const safe: string[] = [];
  for (const property of Array.from(element.style)) {
    const name = property.toLowerCase();
    const value = element.style.getPropertyValue(property).trim();
    if (!ALLOWED_STYLE_PROPERTIES.has(name) || /url|expression|var\s*\(/i.test(value)) continue;
    if ((name === "color" || name === "background-color") && !CSS.supports("color", value)) continue;
    if (name === "font-weight" && !/^(normal|bold|[1-9]00)$/i.test(value)) continue;
    if (name === "font-style" && !/^(normal|italic|oblique)$/i.test(value)) continue;
    if (name.startsWith("text-decoration") && !/^(none|underline|line-through|underline line-through|line-through underline)$/i.test(value)) continue;
    safe.push(`${name}: ${value}`);
  }
  if (safe.length) element.setAttribute("style", safe.join("; "));
  else element.removeAttribute("style");
}

function sanitize(root: HTMLElement): void {
  root.querySelectorAll("*").forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed = name === "style" || (element.tagName === "FONT" && name === "color");
      if (!allowed || /^on/i.test(name)) element.removeAttribute(attribute.name);
    }
    if (element instanceof HTMLElement && element.hasAttribute("style")) sanitizeStyle(element);
    if (element.tagName === "FONT" && element.hasAttribute("color")) {
      const color = element.getAttribute("color") ?? "";
      if (/url|expression/i.test(color) || !CSS.supports("color", color)) element.removeAttribute("color");
    }
  });
}

interface Line {
  html: string;
  text: string;
}

function splitLines(html: string): Line[] {
  const root = document.createElement("div");
  root.innerHTML = html;
  sanitize(root);
  const lines: Line[] = [];
  let buffer: Node[] = [];

  const flushBuffer = () => {
    const wrapper = document.createElement("div");
    buffer.forEach((node) => wrapper.appendChild(node.cloneNode(true)));
    lines.push({ html: wrapper.innerHTML || "<br>", text: wrapper.textContent ?? "" });
    buffer = [];
  };

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.tagName === "DIV" || element.tagName === "P") {
        if (buffer.length) flushBuffer();
        lines.push({ html: element.innerHTML || "<br>", text: element.textContent ?? "" });
        return;
      }
      if (element.tagName === "BR") {
        flushBuffer();
        return;
      }
    }
    buffer.push(node);
  });
  if (buffer.length) flushBuffer();
  if (lines.length === 0) lines.push({ html: "<br>", text: "" });
  return lines;
}

export function normalizeHtml(html: string): string {
  return splitLines(html).map((line) => `<div>${line.html}</div>`).join("");
}

export function toBlocks(html: string): string[] {
  return splitLines(html).map((line) => `<div>${line.html}</div>`);
}

export function htmlToPlain(html: string): string {
  return splitLines(html).map((line) => line.text).join("\n");
}

export function plainToHtml(text: string): string {
  return text.split("\n").map((line) => `<div>${line.length ? escapeHtml(line) : "<br>"}</div>`).join("");
}

export function getBodyHtml(note: { body: string; bodyHtml?: string } | null): string {
  if (!note) return "";
  return note.bodyHtml ?? plainToHtml(note.body);
}