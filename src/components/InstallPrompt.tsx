import { FeatherIcon } from "./icons";

export function InstallPrompt({ open, isIos, onInstall, onDismiss, onClose }: { open: boolean; isIos: boolean; onInstall: () => void; onDismiss: () => void; onClose: () => void }) {
  if (!open) return null;
  return (
    <aside role="dialog" aria-label="Seionをインストール" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 w-[min(22rem,calc(100vw_-_3rem))] rounded-2xl border border-black/10 bg-paper-panel/95 p-5 text-neutral-700 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-ink-panel/95 dark:text-neutral-200">
      <button type="button" aria-label="閉じる" onClick={onClose} className="absolute right-3 top-3 rounded p-1 text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5">×</button>
      <div className="flex gap-3.5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-300"><FeatherIcon /></div>
        <div>
          <h2 className="font-serif text-[15px] tracking-wide">Seionを、この端末に。</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">{isIos ? "Safariの共有ボタンから「ホーム画面に追加」を選択してください。" : "静かな執筆環境を、いつでもすぐに開けます。"}</p>
          <div className="mt-4 flex items-center gap-2">
            {!isIos && <button type="button" onClick={onInstall} className="rounded-lg bg-neutral-700 px-3.5 py-2 text-[12px] text-white transition hover:bg-neutral-600 active:scale-[0.98] dark:bg-neutral-200 dark:text-neutral-900">インストール</button>}
            <button type="button" onClick={onDismiss} className="rounded-lg px-3 py-2 text-[12px] text-neutral-400 transition hover:bg-black/5 dark:hover:bg-white/5">今はしない</button>
          </div>
        </div>
      </div>
    </aside>
  );
}