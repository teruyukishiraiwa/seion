import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  AspectRatio,
  CardPage,
  FontKey,
  Note,
  Settings,
  TextAlign,
} from "../types";
import { FONT_LABELS } from "../constants";
import { fitCardScale } from "../lib/writingCanvas";
import { downscaleImage, downscaleSignatureImage } from "../lib/image";
import { signatureMarginRatio, signatureWidthRatio } from "../lib/signatureGeometry";
import { SnsCard } from "./SnsCard";
import { ExportIcon, ImageIcon, MoonIcon, SunIcon, TrashIcon } from "./icons";

interface InspectorProps {
  note: Note | null;
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onExport: () => void;
  exporting: boolean;
  /** Paginated pages of the current note for SNS export/preview. */
  pages: string[];
}

const FONTS: FontKey[] = ["mincho", "gothic", "serif", "sans"];
const ASPECTS: AspectRatio[] = ["1:1", "9:16", "16:9"];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 px-5 py-4">
      <h3 className="text-[12px] font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-black/[0.04] p-1 dark:bg-white/[0.04]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md py-1.5 text-[12px] transition-colors ${
            value === opt
              ? "bg-paper-panel text-neutral-800 shadow-sm dark:bg-ink-panel dark:text-neutral-100"
              : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>{label}</span>
        <span className="tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-neutral-700 dark:text-neutral-300"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onChange(!checked);
      }}
      className={`relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors ${
        checked
          ? "bg-neutral-600 dark:bg-neutral-300"
          : "bg-black/15 dark:bg-white/15"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform dark:bg-ink ${
          checked ? "translate-x-3.5" : "translate-x-0.5"
        }`}
      />
    </span>
  );
}

export function Inspector({
  note,
  settings,
  update,
  onExport,
  exporting,
  pages,
}: InspectorProps) {
  const [tab, setTab] = useState<"settings" | "info">("settings");
  const fileRef = useRef<HTMLInputElement>(null);
  const signatureFileRef = useRef<HTMLInputElement>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);

  // Sliding underline indicator for the tab bar.
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const multiPage = settings.splitPages && pages.length > 1;

  // Keep the preview page in range as pagination changes.
  useEffect(() => {
    setPreviewPage((p) => Math.min(p, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const previewPageData: CardPage | null = multiPage
    ? {
        body: pages[Math.min(previewPage, pages.length - 1)] ?? "",
        showTitle: previewPage === 0,
        index: previewPage,
        total: pages.length,
      }
    : null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Downscale before storing so large photos don't overflow localStorage.
    downscaleImage(file)
      .then((dataUrl) => update("backgroundImage", dataUrl))
      .catch((err) => console.error("背景画像の読み込みに失敗しました", err));
    e.target.value = "";
  };


  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSignatureError(null);
    downscaleSignatureImage(file)
      .then(({ dataUrl, aspectRatio }) => {
        update("signatureImage", dataUrl);
        update("signatureAspectRatio", aspectRatio);
        update("signatureEnabled", true);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "署名画像の読み込みに失敗しました";
        setSignatureError(message);
      });
    event.target.value = "";
  };

  // Preview scale: fit the card into the inspector's preview column.
  const previewMaxW = 132;

  return (
    <aside className="flex w-full shrink-0 flex-col xl:w-80 border-l border-black/5 bg-paper-panel xl:bg-paper-soft/40 motion-safe:animate-fadeIn dark:border-white/5 dark:bg-ink-panel xl:dark:bg-ink-soft/40">
      {/* Tabs */}
      <div className="relative flex items-center gap-6 border-b border-black/5 px-5 pt-4 dark:border-white/5">
        {(["settings", "info"] as const).map((t) => (
          <button
            key={t}
            ref={(el) => (tabRefs.current[t] = el)}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-[13px] transition-colors ${
              tab === t
                ? "text-neutral-800 dark:text-neutral-100"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {t === "settings" ? "設定" : "情報"}
          </button>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-neutral-700 transition-all duration-300 ease-out motion-reduce:transition-none dark:bg-neutral-200"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          key={tab}
          className="divide-y divide-black/5 motion-safe:animate-fadeIn dark:divide-white/5"
        >
        {tab === "info" ? (
          <Section title="情報">
            <dl className="space-y-2 text-[12px] text-neutral-500 dark:text-neutral-400">
              <div className="flex justify-between">
                <dt>文字数</dt>
                <dd className="tabular-nums">
                  {((note?.title ?? "") + (note?.body ?? "")).replace(/\n/g, "")
                    .length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>行数</dt>
                <dd className="tabular-nums">
                  {note ? note.body.split("\n").length : 0}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>更新</dt>
                <dd>
                  {note
                    ? new Date(note.updatedAt).toLocaleString("ja-JP")
                    : "—"}
                </dd>
              </div>
            </dl>
          </Section>
        ) : (
          <>
            <Section title="フォント">
              <Segmented
                options={FONTS}
                value={settings.font}
                labels={FONT_LABELS}
                onChange={(v) => update("font", v)}
              />
            </Section>

            <Section title="文字設定">
              <Slider
                label="文字サイズ"
                value={settings.fontSize}
                min={12}
                max={24}
                step={1}
                display={`${settings.fontSize}`}
                onChange={(v) => update("fontSize", v)}
              />
              <Slider
                label="行間"
                value={settings.lineHeight}
                min={1.4}
                max={2.6}
                step={0.05}
                display={settings.lineHeight.toFixed(2)}
                onChange={(v) => update("lineHeight", v)}
              />
              <Slider
                label="文字間"
                value={settings.letterSpacing}
                min={0}
                max={0.2}
                step={0.01}
                display={`${settings.letterSpacing.toFixed(2)}em`}
                onChange={(v) => update("letterSpacing", v)}
              />
              <Slider
                label="本文幅"
                value={settings.contentWidth}
                min={480}
                max={840}
                step={20}
                display={`${settings.contentWidth}px`}
                onChange={(v) => update("contentWidth", v)}
              />
            </Section>

            <Section title="テーマ">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => update("theme", "light")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-[12px] transition-colors ${
                    settings.theme === "light"
                      ? "border-black/15 bg-paper-panel text-neutral-800 shadow-sm dark:border-white/20 dark:bg-ink-panel dark:text-neutral-100"
                      : "border-transparent text-neutral-500 hover:bg-black/[0.03] dark:text-neutral-400 dark:hover:bg-white/5"
                  }`}
                >
                  <SunIcon className="opacity-70" />
                  ライト
                </button>
                <button
                  onClick={() => update("theme", "dark")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-[12px] transition-colors ${
                    settings.theme === "dark"
                      ? "border-black/15 bg-paper-panel text-neutral-800 shadow-sm dark:border-white/20 dark:bg-ink-panel dark:text-neutral-100"
                      : "border-transparent text-neutral-500 hover:bg-black/[0.03] dark:text-neutral-400 dark:hover:bg-white/5"
                  }`}
                >
                  <MoonIcon className="opacity-70" />
                  ダーク
                </button>
              </div>
            </Section>

            <Section title="背景画像">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
                  {settings.backgroundImage ? (
                    <img
                      src={settings.backgroundImage}
                      alt="背景"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-neutral-400" />
                  )}
                </div>
                <span className="flex-1 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                  {settings.backgroundImage ? "背景画像" : "未設定"}
                </span>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-black/10 px-3 py-1.5 text-[12px] text-neutral-600 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                >
                  {settings.backgroundImage ? "変更" : "選択"}
                </button>
                {settings.backgroundImage && (
                  <button
                    onClick={() => update("backgroundImage", null)}
                    aria-label="背景画像を削除"
                    className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.03] hover:text-neutral-600 dark:hover:bg-white/5"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              {settings.backgroundImage && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] text-neutral-600 dark:text-neutral-300">
                    背景を表示
                  </span>
                  <Toggle
                    checked={settings.backgroundEnabled}
                    onChange={(v) => update("backgroundEnabled", v)}
                  />
                </div>
              )}

              <div className="pt-1">
                <Segmented<"light" | "dark">
                  options={["light", "dark"]}
                  value={settings.overlayColor}
                  labels={{ light: "白レイヤー", dark: "黒レイヤー" }}
                  onChange={(v) => update("overlayColor", v)}
                />
              </div>
              <Slider
                label="レイヤー濃度"
                value={settings.overlayOpacity}
                min={0}
                max={0.8}
                step={0.05}
                display={`${Math.round(settings.overlayOpacity * 100)}%`}
                onChange={(v) => update("overlayOpacity", v)}
              />

              {settings.backgroundImage && (
                <>
                  <Slider
                    label="背景のぼかし"
                    value={settings.backgroundBlur}
                    min={0}
                    max={40}
                    step={2}
                    display={settings.backgroundBlur === 0 ? "なし" : `${settings.backgroundBlur}`}
                    onChange={(value) => update("backgroundBlur", value)}
                  />

                  <Slider
                    label="横位置"
                    value={settings.backgroundPosX}
                    min={0}
                    max={100}
                    step={1}
                    display={`${settings.backgroundPosX}%`}
                    onChange={(v) => update("backgroundPosX", v)}
                  />
                  <Slider
                    label="縦位置"
                    value={settings.backgroundPosY}
                    min={0}
                    max={100}
                    step={1}
                    display={`${settings.backgroundPosY}%`}
                    onChange={(v) => update("backgroundPosY", v)}
                  />
                </>
              )}
            </Section>


            <Section title="署名">
              <input
                ref={signatureFileRef}
                type="file"
                accept="image/png,image/webp"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/5">
                  {settings.signatureImage ? (
                    <img
                      src={settings.signatureImage}
                      alt="署名"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="text-neutral-400" />
                  )}
                </div>
                <span className="flex-1 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                  {settings.signatureImage ? "署名画像" : "未設定"}
                </span>
                <button
                  type="button"
                  onClick={() => signatureFileRef.current?.click()}
                  className="rounded-md border border-black/10 px-3 py-1.5 text-[12px] text-neutral-600 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                >
                  {settings.signatureImage ? "変更" : "選択"}
                </button>
                {settings.signatureImage && (
                  <button
                    type="button"
                    onClick={() => update("signatureImage", null)}
                    aria-label="署名画像を削除"
                    className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.03] hover:text-neutral-600 dark:hover:bg-white/5"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              {signatureError && (
                <p role="alert" className="text-[11px] leading-relaxed text-[#b0413e]">
                  {signatureError}
                </p>
              )}
              {settings.signatureImage && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="block text-[12px] text-neutral-600 dark:text-neutral-300">
                        署名を表示
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        本文末尾の右端に配置
                      </span>
                    </div>
                    <Toggle
                      checked={settings.signatureEnabled}
                      onChange={(value) => update("signatureEnabled", value)}
                    />
                  </div>
                  <Slider
                    label="署名サイズ"
                    value={settings.signatureWidth}
                    min={69}
                    max={432}
                    step={9}
                    display={`${Math.round(signatureWidthRatio(settings) * 100)}%`}
                    onChange={(value) => update("signatureWidth", value)}
                  />
                  <Slider
                    label="本文との間隔"
                    value={settings.signatureMarginTop}
                    min={9}
                    max={130}
                    step={9}
                    display={`${Math.round(signatureMarginRatio(settings) * 100)}%`}
                    onChange={(value) => update("signatureMarginTop", value)}
                  />
                </>
              )}
            </Section>

            <Section title="SNS用画像出力">
              <div className="space-y-1.5">
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                  アスペクト比
                </span>
                <Segmented
                  options={ASPECTS}
                  value={settings.aspect}
                  onChange={(v) => update("aspect", v)}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                  本文の配置
                </span>
                <Segmented<TextAlign>
                  options={["left", "center"]}
                  value={settings.snsTextAlign}
                  labels={{ left: "左寄せ", center: "中央" }}
                  onChange={(v) => update("snsTextAlign", v)}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                  <span className="block text-[12px] text-neutral-600 dark:text-neutral-300">
                    複数枚に分割
                  </span>
                  <span className="block text-[11px] text-neutral-400">
                    収まらない文章を複数画像に分けて出力
                  </span>
                </div>
                <Toggle
                  checked={settings.splitPages}
                  onChange={(v) => update("splitPages", v)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    プレビュー
                  </span>
                  {multiPage && (
                    <span className="text-[11px] text-neutral-400">
                      全 {pages.length} 枚
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-center rounded-lg bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                  <SnsCard
                    note={note}
                    settings={settings}
                    page={previewPageData}
                    scale={fitCardScale(previewMaxW, Number.POSITIVE_INFINITY, settings.aspect)}
                  />
                </div>
                {multiPage && (
                  <div className="flex items-center justify-center gap-4 text-[12px] text-neutral-500 dark:text-neutral-400">
                    <button
                      aria-label="前のページ"
                      disabled={previewPage === 0}
                      onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                      className="rounded px-2 py-0.5 transition-colors hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                    >
                      ‹
                    </button>
                    <span className="tabular-nums">
                      {previewPage + 1} / {pages.length}
                    </span>
                    <button
                      aria-label="次のページ"
                      disabled={previewPage >= pages.length - 1}
                      onClick={() =>
                        setPreviewPage((p) =>
                          Math.min(pages.length - 1, p + 1),
                        )
                      }
                      className="rounded px-2 py-0.5 transition-colors hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onExport}
                disabled={exporting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-800 py-2.5 text-[13px] text-paper-soft transition hover:bg-neutral-700 enabled:active:scale-[0.99] disabled:opacity-60 dark:bg-neutral-200 dark:text-ink dark:hover:bg-white"
              >
                <ExportIcon />
                {exporting
                  ? "出力中…"
                  : multiPage
                    ? `画像を ${pages.length} 枚出力`
                    : "画像をエクスポート"}
              </button>
            </Section>
          </>
        )}
        </div>
      </div>
    </aside>
  );
}
