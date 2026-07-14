import { useEffect, useRef, useState } from "react";
import { Editor } from "./components/Editor";
import { Inspector } from "./components/Inspector";
import { Sidebar } from "./components/Sidebar";
import { SnsCard } from "./components/SnsCard";
import { TopBar } from "./components/TopBar";
import { InstallPrompt } from "./components/InstallPrompt";
import { useNotes } from "./hooks/useNotes";
import { usePages } from "./hooks/usePages";
import { useSettings } from "./hooks/useSettings";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { articleSettingsFrom, getEffectiveSettings } from "./constants";
import { exportNodeToPng, pageFilename, safeFilename } from "./lib/exportImage";
import type { ArticleSettings, CardPage, Settings } from "./types";

type MobilePanel = "notes" | "settings" | null;

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const nextPaint = () => delay(80);

export default function App() {
  const {
    notes,
    selected,
    selectedId,
    setSelectedId,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    deletePermanently,
    emptyTrash,
    saving,
    saveNow,
    storageError: noteStorageError,
    clearStorageError: clearNoteStorageError,
  } = useNotes();
  const {
    settings,
    update,
    storageError: settingsStorageError,
    clearStorageError: clearSettingsStorageError,
  } = useSettings();
  const effectiveSettings = getEffectiveSettings(selected, settings);
  const pages = usePages(selected, effectiveSettings);
  const [focusMode, setFocusMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPage, setExportPage] = useState<CardPage | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const pwa = usePwaInstall(hasEdited);
  const exportRef = useRef<HTMLDivElement>(null);
  const storageError = noteStorageError ?? settingsStorageError;

  const clearStorageError = () => {
    clearNoteStorageError();
    clearSettingsStorageError();
  };

  useEffect(() => {
    if (!storageError) return;
    const timer = window.setTimeout(clearStorageError, 6000);
    return () => window.clearTimeout(timer);
  }, [storageError]);

  useEffect(() => {
    if (!mobilePanel) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobilePanel(null); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mobilePanel]);

  const title = selected?.title ?? "Seion";
  const isMultiPage = effectiveSettings.splitPages && pages.length > 1;

  const createNoteWithCurrentSettings = () => {
    createNote(articleSettingsFrom(effectiveSettings));
  };

  const updateSelectedArticleSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (key === "theme" || key === "editorAspectMode") {
      update(key, value);
      return;
    }
    if (!selected) return;
    updateNote(selected.id, { settings: { [key]: value } as Partial<ArticleSettings> });
  };

  const handleExport = async () => {
    const node = exportRef.current;
    if (!node || exporting || !selected || selected.trashedAt != null) return;
    setExporting(true);
    try {
      if (!isMultiPage) {
        setExportPage(null);
        await nextPaint();
        await exportNodeToPng(node, safeFilename(title, effectiveSettings.aspect));
      } else {
        for (let index = 0; index < pages.length; index += 1) {
          setExportPage({ body: pages[index], showTitle: index === 0, index, total: pages.length });
          await nextPaint();
          await exportNodeToPng(node, pageFilename(title, effectiveSettings.aspect, index + 1, pages.length));
          if (index < pages.length - 1) await delay(350);
        }
      }
    } catch (error) {
      console.error("画像のエクスポートに失敗しました", error);
      alert("画像のエクスポートに失敗しました。");
    } finally {
      setExportPage(null);
      setExporting(false);
    }
  };

  return (
    <div className="app-shell flex h-[100dvh] flex-col overflow-hidden bg-paper text-neutral-800 dark:bg-ink dark:text-neutral-200">
      <TopBar
        saving={saving}
        theme={settings.theme}
        focusMode={focusMode}
        onSetTheme={(theme) => update("theme", theme)}
        onCreate={createNoteWithCurrentSettings}
        onSetFocusMode={setFocusMode}
        onSave={saveNow}
        onExport={handleExport}
        installAvailable={pwa.available}
        onInstall={pwa.show}
        mobilePanel={mobilePanel}
        onToggleNotes={() => setMobilePanel((panel) => panel === "notes" ? null : "notes")}
        onToggleSettings={() => setMobilePanel((panel) => panel === "settings" ? null : "settings")}
      />

      <div className="flex min-h-0 flex-1">
        {!focusMode && (
          <>
            {mobilePanel === "notes" && <button type="button" aria-label="ノート一覧を閉じる" className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] md:hidden" onClick={() => setMobilePanel(null)} />}
            <div className={`${mobilePanel === "notes" ? "translate-x-0" : "-translate-x-full"} fixed inset-y-14 left-0 z-40 flex w-[min(21rem,88vw)] transition-transform duration-200 md:static md:inset-auto md:z-auto md:w-auto md:translate-x-0 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 md:shadow-none md:ring-0 md:transition-none`}>
              <Sidebar
                notes={notes}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setMobilePanel(null); }}
                onCreate={() => { createNoteWithCurrentSettings(); setMobilePanel(null); }}
                onTrash={trashNote}
                onRestore={restoreNote}
                onDeletePermanently={deletePermanently}
                onEmptyTrash={emptyTrash}
              />
            </div>
          </>
        )}

        <Editor
          note={selected}
          settings={effectiveSettings}
          focusMode={focusMode}
          readOnly={selected?.trashedAt != null}
          onChange={(patch) => { if (selected) { setHasEdited(true); updateNote(selected.id, patch); } }}
          onToggleFocus={setFocusMode}
          onToggleAspectMode={(value) => update("editorAspectMode", value)}
          pages={pages}
        />

        {!focusMode && selected?.trashedAt == null && (
          <>
            {mobilePanel === "settings" && <button type="button" aria-label="設定を閉じる" className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] xl:hidden" onClick={() => setMobilePanel(null)} />}
            <div className={`${mobilePanel === "settings" ? "translate-x-0" : "translate-x-full"} fixed inset-y-14 right-0 z-40 flex w-[min(22rem,92vw)] transition-transform duration-200 xl:static xl:inset-auto xl:z-auto xl:w-auto xl:translate-x-0 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 xl:shadow-none xl:ring-0 xl:transition-none`}>
              <Inspector note={selected} settings={effectiveSettings} update={updateSelectedArticleSetting} onExport={handleExport} exporting={exporting} pages={pages} />
            </div>
          </>
        )}
      </div>

      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        <SnsCard ref={exportRef} note={selected} settings={effectiveSettings} scale={1} page={exportPage} />
      </div>

      <InstallPrompt open={pwa.open} isIos={pwa.isIos} onInstall={pwa.install} onDismiss={pwa.dismiss} onClose={pwa.close} />

      {storageError && (
        <div role="alert" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[calc(100%_-_2rem)] z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border border-black/10 bg-paper-panel px-4 py-3 text-[13px] text-neutral-700 shadow-lg dark:border-white/10 dark:bg-ink-panel dark:text-neutral-200">
          <span className="leading-relaxed">{storageError}</span>
          <button type="button" aria-label="閉じる" onClick={clearStorageError} className="shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200">×</button>
        </div>
      )}
    </div>
  );
}
