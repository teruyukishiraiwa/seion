import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, Settings } from "../types";
import { APP_NAME, FONT_STACKS, hasActiveBackground } from "../constants";
import { getBodyHtml, htmlToPlain, normalizeHtml, toBlocks } from "../lib/richText";
import { signatureMarginRatio, signatureWidthRatio } from "../lib/signatureGeometry";
import { backgroundBlurForEditor, backgroundScaleForEditor } from "../lib/backgroundGeometry";
import { fitWritingCanvas } from "../lib/writingCanvas";
import { cardGeometry } from "../lib/cardGeometry";
import { backgroundBlurForCard, backgroundScaleForCard } from "../lib/backgroundGeometry";
import { signatureMarginForCard, signatureWidthForCard } from "../lib/signatureGeometry";
import { FeatherIcon } from "./icons";
import { SnsCard } from "./SnsCard";

interface EditorProps {
  note: Note | null;
  settings: Settings;
  focusMode: boolean;
  readOnly: boolean;
  onChange: (patch: { title?: string; body?: string; bodyHtml?: string }) => void;
  onToggleFocus: (value: boolean) => void;
  onToggleAspectMode: (value: boolean) => void;
  pages?: string[];
}

const TEXT_COLORS = [
  { label: "茜", value: "#b0413e" },
  { label: "藍", value: "#2f5d8a" },
  { label: "苔", value: "#5a7052" },
  { label: "金茶", value: "#9a7b4f" },
];

const HIGHLIGHT_COLORS = [
  { label: "黄", value: "#fbe6a2" },
  { label: "桃", value: "#f6d4d8" },
  { label: "空", value: "#d3e4f3" },
  { label: "若草", value: "#dcebb7" },
];

type Mark = "bold" | "italic" | "underline" | "strikeThrough";
type EditorZoom = "auto" | 0.5 | 0.75 | 1;

interface ToolbarState {
  top: number;
  left: number;
  marks: Record<Mark, boolean>;
}

function countChars(title: string, body: string): number {
  return (title + body).replace(/\n/g, "").length;
}

export function Editor({
  note,
  settings,
  focusMode,
  readOnly,
  onChange,
  onToggleFocus,
  onToggleAspectMode,
  pages = [],
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [editorZoom, setEditorZoom] = useState<EditorZoom>("auto");

  const noteId = note?.id ?? null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !settings.editorAspectMode) return;
    const updateSize = () => {
      const styles = window.getComputedStyle(stage);
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      setCanvasSize(fitWritingCanvas(
        Math.max(0, stage.clientWidth - horizontalPadding),
        Math.max(0, stage.clientHeight - verticalPadding),
        settings.aspect,
      ));
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [settings.aspect, settings.editorAspectMode, focusMode]);

  // Load the note's rich body into the editor when switching notes only, so
  // typing never resets the caret.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = getBodyHtml(note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, settings.editorAspectMode]);

  const syncFromDom = useCallback(() => {
    const el = editorRef.current;
    if (!el || !noteId || readOnly || composingRef.current) return;
    const html = el.innerHTML;
    onChange({ bodyHtml: normalizeHtml(html), body: htmlToPlain(html) });
  }, [noteId, onChange, readOnly]);

  const toggleAspectMode = useCallback(() => {
    // Commit the old editing surface before React replaces it with the other mode.
    composingRef.current = false;
    syncFromDom();
    setToolbar(null);
    onToggleAspectMode(!settings.editorAspectMode);
  }, [onToggleAspectMode, settings.editorAspectMode, syncFromDom]);

  const beginComposition = useCallback(() => {
    composingRef.current = true;
  }, []);

  const endComposition = useCallback(() => {
    composingRef.current = false;
    syncFromDom();
  }, [syncFromDom]);

  // Floating toolbar: show above the current non-empty selection in the editor.
  const refreshToolbar = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (
      !el ||
      !sel ||
      sel.rangeCount === 0 ||
      sel.isCollapsed ||
      !el.contains(sel.anchorNode)
    ) {
      setToolbar(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setToolbar(null);
      return;
    }
    const top = rect.top - 8;
    setToolbar({
      top,
      left: rect.left + rect.width / 2,
      marks: {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
      },
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshToolbar);
    return () => document.removeEventListener("selectionchange", refreshToolbar);
  }, [refreshToolbar]);

  // Keep the toolbar glued to the selection while scrolling the editor.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.addEventListener("scroll", refreshToolbar);
    return () => node.removeEventListener("scroll", refreshToolbar);
  }, [refreshToolbar]);

  const exec = useCallback(
    (command: string, value?: string) => {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, value);
      syncFromDom();
      refreshToolbar();
    },
    [syncFromDom, refreshToolbar],
  );

  const applyHighlight = useCallback(
    (color: string) => {
      document.execCommand("styleWithCSS", false, "true");
      if (!document.execCommand("hiliteColor", false, color)) {
        document.execCommand("backColor", false, color);
      }
      syncFromDom();
      refreshToolbar();
    },
    [syncFromDom, refreshToolbar],
  );

  if (!note) {
    return (
      <main className="canvas-depth flex flex-1 flex-col items-center justify-center gap-4 bg-paper-panel text-center dark:bg-ink-panel">
        <FeatherIcon className="text-neutral-300 dark:text-neutral-600" width={28} height={28} />
        <p className="text-[13px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          左の一覧からノートを選ぶか、
          <br />
          新しいノートを作成してください。
        </p>
      </main>
    );
  }

  const fontFamily = FONT_STACKS[settings.font];
  const bodyStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}em`,
  };
  const isEmpty = !note.body.trim();
  const card = cardGeometry(settings.aspect);
  const autoCardScale = canvasSize.width > 0 ? canvasSize.width / card.w : 0;
  const cardScale = editorZoom === "auto" ? autoCardScale : editorZoom;
  const displayedCardSize = { width: card.w * cardScale, height: card.h * cardScale };
  const zoomSteps: EditorZoom[] = ["auto", 0.5, 0.75, 1];
  const changeZoomByWheel = (deltaY: number) => {
    const index = zoomSteps.indexOf(editorZoom);
    const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, index + (deltaY < 0 ? 1 : -1)));
    setEditorZoom(zoomSteps[nextIndex]);
  };
  const cardTextColor = settings.overlayColor === "dark" ? "#f3f0ea" : "#2b2a28";
  const cardSubColor = settings.overlayColor === "dark" ? "rgba(243,240,234,0.65)" : "rgba(43,42,40,0.55)";
  const firstPageBlockCount = settings.splitPages && pages.length > 1
    ? toBlocks(pages[0] ?? "").length
    : Number.POSITIVE_INFINITY;

  // Buttons preserve the selection by preventing the default focus shift.
  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <main className="canvas-depth relative flex min-w-0 flex-1 flex-col bg-paper-panel dark:bg-ink-panel">
      <div ref={stageRef} onWheel={(event) => { if (settings.editorAspectMode && (event.ctrlKey || event.metaKey)) { event.preventDefault(); changeZoomByWheel(event.deltaY); } }} style={settings.editorAspectMode ? { display: "flex", alignItems: "safe center", justifyContent: "safe center" } : undefined} className={`relative min-h-0 flex-1 overflow-auto ${settings.editorAspectMode ? "bg-neutral-100/70 p-2.5 sm:p-4 lg:p-5 dark:bg-black/20" : ""}`}>
        {settings.editorAspectMode ? (
          <div data-testid="page-stack" className="flex shrink-0 flex-col items-center" style={{ width: displayedCardSize.width, gap: Math.max(16, card.padding * cardScale * 0.22) }}>
          <div style={{ width: displayedCardSize.width, height: displayedCardSize.height, aspectRatio: `${card.w} / ${card.h}` }} className="relative shrink-0 overflow-hidden shadow-sm">
            <div
              data-testid="writing-canvas"
              data-layout="wysiwyg"
              className={`relative overflow-hidden layer-${settings.overlayColor}`}
              style={{
                width: card.w,
                height: card.h,
                transform: `scale(${cardScale})`,
                transformOrigin: "top left",
                background: settings.overlayColor === "dark" ? "linear-gradient(160deg, #2b2a28 0%, #1c1b1a 100%)" : "linear-gradient(160deg, #ffffff 0%, #f3f0ea 100%)",
              }}
            >
              {hasActiveBackground(settings) && (
                <>
                  <img aria-hidden src={settings.backgroundImage as string} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${settings.backgroundPosX}% ${settings.backgroundPosY}%`, filter: settings.backgroundBlur > 0 ? `blur(${backgroundBlurForCard(settings)}px)` : undefined, transform: `scale(${backgroundScaleForCard(settings)})` }} />
                  <div aria-hidden style={{ position: "absolute", inset: 0, backgroundColor: `rgba(${settings.overlayColor === "dark" ? "0,0,0" : "255,255,255"}, ${settings.overlayOpacity})` }} />
                </>
              )}
              <div
                ref={scrollRef}
                style={{ position: "absolute", inset: `0 0 ${card.padding}px 0`, display: "flex", flexDirection: "column", justifyContent: settings.aspect === "9:16" ? "center" : "flex-start", padding: card.padding, overflow: "hidden", fontFamily, textAlign: settings.snsTextAlign, alignItems: settings.snsTextAlign === "center" ? "center" : "flex-start" }}
              >
                <div key={`title-${noteId}`} contentEditable={!readOnly} aria-readonly={readOnly} suppressContentEditableWarning role="textbox" aria-label="タイトル" spellCheck={false} onInput={(e) => onChange({ title: e.currentTarget.textContent ?? "" })} style={{ width: "100%", maxWidth: "100%", margin: 0, marginBottom: card.titleMarginBottom, padding: 0, outline: 0, background: "transparent", fontFamily, fontSize: card.titleSize, fontWeight: 500, lineHeight: card.titleLineHeight, letterSpacing: `${card.titleLetterSpacing}em`, color: cardTextColor, textAlign: settings.snsTextAlign, overflowWrap: "anywhere", wordBreak: "break-word" }}>{note.title || "無題"}</div>
                <div className="relative w-full">
                  {isEmpty && <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", fontSize: card.bodySize, lineHeight: card.bodyLineHeight, letterSpacing: `${card.bodyLetterSpacing}em`, color: cardSubColor }}>いま感じていることを、静かに書きとめてください。</div>}
                  {Number.isFinite(firstPageBlockCount) && <style>{`.wysiwyg-first-page-editor > :nth-child(n + ${firstPageBlockCount + 1}) { display: none !important; }`}</style>}
                  <div ref={editorRef} contentEditable={!readOnly} aria-readonly={readOnly} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="本文" spellCheck={false} onInput={syncFromDom} onCompositionStart={beginComposition} onCompositionEnd={endComposition} onFocus={() => document.execCommand("styleWithCSS", false, "true")} onBlur={() => window.setTimeout(refreshToolbar, 120)} className="wysiwyg-first-page-editor" style={{ width: "100%", minHeight: card.bodySize * card.bodyLineHeight, margin: 0, outline: 0, background: "transparent", whiteSpace: "pre-wrap", fontSize: card.bodySize, lineHeight: card.bodyLineHeight, letterSpacing: `${card.bodyLetterSpacing}em`, color: cardTextColor, overflowWrap: "anywhere", wordBreak: "break-word" }} />
                  {settings.signatureEnabled && settings.signatureImage && (!settings.splitPages || pages.length <= 1) && <img src={settings.signatureImage} alt="" aria-label="署名画像" style={{ display: "block", width: signatureWidthForCard(settings), height: "auto", maxWidth: "100%", marginTop: signatureMarginForCard(settings), marginLeft: "auto", objectFit: "contain" }} />}
                </div>
              </div>
              <div aria-hidden style={{ position: "absolute", bottom: card.padding * 0.55, left: 0, right: 0, textAlign: "center", fontFamily: FONT_STACKS.serif, fontSize: card.footerSize, letterSpacing: "0.18em", color: cardSubColor }}>{APP_NAME}</div>
              {settings.splitPages && pages.length > 1 && (
                <div aria-label={`ページ境界 1 / ${pages.length}`} style={{ position: "absolute", right: card.padding, bottom: card.padding * 0.55, fontFamily: FONT_STACKS.serif, fontSize: card.footerSize * 0.95, letterSpacing: "0.12em", color: cardSubColor }}>1 / {pages.length}</div>
              )}
            </div>
          </div>
          {settings.splitPages && pages.slice(1).map((body, offset) => {
            const index = offset + 1;
            return (
              <div key={`page-${index}`} data-testid={`writing-page-${index + 1}`} className="shrink-0 shadow-sm">
                <SnsCard note={note} settings={settings} scale={cardScale} page={{ body, showTitle: false, index, total: pages.length }} />
              </div>
            );
          })}
          </div>
        ) : (
          <div data-testid="writing-canvas" data-layout="fluid" className="relative h-full w-full overflow-hidden">
            {hasActiveBackground(settings) && <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden"><img src={settings.backgroundImage as string} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${settings.backgroundPosX}% ${settings.backgroundPosY}%`, filter: settings.backgroundBlur > 0 ? `blur(${backgroundBlurForEditor(settings)}px)` : undefined, transform: `scale(${backgroundScaleForEditor(settings)})` }} /><div className="absolute inset-0" style={{ backgroundColor: `rgba(${settings.overlayColor === "dark" ? "0,0,0" : "255,255,255"}, ${settings.overlayOpacity})` }} /></div>}
            <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto"><div className="mx-auto px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14" style={{ maxWidth: `${settings.contentWidth}px` }}><input value={note.title} readOnly={readOnly} onChange={(e) => onChange({ title: e.target.value })} placeholder="無題" spellCheck={false} className="mb-8 w-full bg-transparent font-serif font-medium tracking-wide text-neutral-900 placeholder:text-neutral-300 focus:outline-none dark:text-neutral-50 dark:placeholder:text-neutral-600" style={{ fontFamily, fontSize: `${Math.round(settings.fontSize * 1.75)}px`, letterSpacing: `${settings.letterSpacing}em` }} /><div className="relative min-h-[40vh]">{isEmpty && <div className="pointer-events-none absolute left-0 top-0 text-neutral-300 dark:text-neutral-600" style={{ ...bodyStyle, overflowWrap: "anywhere", wordBreak: "break-word" }}>いま感じていることを、静かに書きとめてください。</div>}<div ref={editorRef} contentEditable={!readOnly} aria-readonly={readOnly} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="本文" spellCheck={false} onInput={syncFromDom} onCompositionStart={beginComposition} onCompositionEnd={endComposition} onFocus={() => document.execCommand("styleWithCSS", false, "true")} onBlur={() => window.setTimeout(refreshToolbar, 120)} className="min-h-[8rem] w-full min-w-0 bg-transparent text-neutral-800 focus:outline-none dark:text-neutral-200" style={{ ...bodyStyle, overflowWrap: "anywhere", wordBreak: "break-word" }} />{settings.signatureEnabled && settings.signatureImage && <div aria-label="署名画像" className="flex justify-end" style={{ marginTop: `${signatureMarginRatio(settings) * 100}%` }}><img src={settings.signatureImage} alt="" className="block max-w-full object-contain" style={{ width: `${signatureWidthRatio(settings) * 100}%`, height: "auto" }} /></div>}</div></div></div>
          </div>
        )}
      </div>      {/* Floating formatting toolbar */}
      {toolbar && (
        <div
          className="fixed z-30 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-lg border border-black/10 bg-paper-panel px-1.5 py-1 shadow-lg dark:border-white/10 dark:bg-ink-soft"
          style={{ top: toolbar.top, left: toolbar.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarButton
            active={toolbar.marks.bold}
            onClick={hold(() => exec("bold"))}
            label="太字"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            active={toolbar.marks.italic}
            onClick={hold(() => exec("italic"))}
            label="斜体"
          >
            <span className="italic font-serif">I</span>
          </ToolbarButton>
          <ToolbarButton
            active={toolbar.marks.underline}
            onClick={hold(() => exec("underline"))}
            label="下線"
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            active={toolbar.marks.strikeThrough}
            onClick={hold(() => exec("strikeThrough"))}
            label="打消し線"
          >
            <span className="line-through">S</span>
          </ToolbarButton>

          <Divider />

          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              aria-label={`文字色 ${c.label}`}
              title={`文字色 ${c.label}`}
              onMouseDown={hold(() => exec("foreColor", c.value))}
              className="flex h-7 w-5 items-center justify-center"
            >
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: c.value }}
              />
            </button>
          ))}
          <button
            aria-label="文字色 カスタム"
            title="文字色 カスタム"
            onMouseDown={hold(() => colorInputRef.current?.click())}
            className="flex h-7 w-5 items-center justify-center text-[11px] text-neutral-500 dark:text-neutral-400"
          >
            <span className="leading-none">＋</span>
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            onChange={(e) => exec("foreColor", e.target.value)}
          />

          <Divider />

          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              aria-label={`蛍光 ${c.label}`}
              title={`蛍光 ${c.label}`}
              onMouseDown={hold(() => applyHighlight(c.value))}
              className="flex h-7 w-5 items-center justify-center"
            >
              <span
                className="h-3.5 w-3.5 rounded-[3px] ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: c.value }}
              />
            </button>
          ))}

          <Divider />

          <ToolbarButton onClick={hold(() => exec("removeFormat"))} label="装飾を解除">
            <span className="text-[13px]">✕</span>
          </ToolbarButton>
        </div>
      )}

      {/* Status bar */}
      <div className="relative z-10 flex min-h-[4.5rem] shrink-0 flex-col items-stretch justify-center gap-1.5 border-t border-black/5 px-4 py-2 text-[12px] text-neutral-400 dark:border-white/5 sm:h-11 sm:min-h-11 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-0">
        <div className="flex min-w-0 items-center gap-3"><span>{countChars(note.title, note.body).toLocaleString()} 文字</span><span className="hidden lg:inline">日本語 (自動検出)</span>{settings.splitPages && pages.length > 1 && <span aria-live="polite">{pages.length}ページに分割</span>}</div>
        <div className="flex min-w-0 items-center justify-between gap-3 sm:shrink-0 sm:justify-start sm:gap-4">
          {settings.editorAspectMode && (
            <label className="flex items-center gap-2">
              <span><span className="sm:hidden">倍率</span><span className="hidden sm:inline">表示倍率</span></span>
              <select aria-label="表示倍率" value={String(editorZoom)} onChange={(event) => setEditorZoom(event.target.value === "auto" ? "auto" : Number(event.target.value) as EditorZoom)} className="rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-[12px] text-neutral-500 focus:outline-none dark:border-white/10 dark:text-neutral-300">
                <option value="auto">自動</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option>
              </select>
            </label>
          )}
          <div className="flex items-center gap-2">
            <span id="aspect-mode-label"><span className="sm:hidden">投稿比率</span><span className="hidden sm:inline">投稿比率で表示</span>{settings.editorAspectMode ? ` (${settings.aspect})` : ""}</span>
            <button type="button" role="switch" aria-checked={settings.editorAspectMode} aria-labelledby="aspect-mode-label" onClick={toggleAspectMode} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${settings.editorAspectMode ? "bg-neutral-600 dark:bg-neutral-300" : "bg-black/15 dark:bg-white/15"}`}>
              <span aria-hidden className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform dark:bg-ink ${settings.editorAspectMode ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span id="focus-mode-label">集中モード</span>
            <button type="button" role="switch" aria-checked={focusMode} aria-labelledby="focus-mode-label" onClick={() => onToggleFocus(!focusMode)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${focusMode ? "bg-neutral-600 dark:bg-neutral-300" : "bg-black/15 dark:bg-white/15"}`}>
              <span aria-hidden className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform dark:bg-ink ${focusMode ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>    </main>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onMouseDown={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-[13px] transition-colors ${
        active
          ? "bg-black/10 text-neutral-900 dark:bg-white/15 dark:text-neutral-50"
          : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-black/10 dark:bg-white/10" />;
}
