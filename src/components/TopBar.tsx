import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "../constants";
import type { Theme } from "../types";
import { CreditsDialog } from "./CreditsDialog";
import {
  CheckIcon,
  ExportIcon,
  FeatherIcon,
  FolderIcon,
  ImageIcon,
  InfoIcon,
  MenuIcon,
  MoonIcon,
  PlusIcon,
  SaveIcon,
  SunIcon,
} from "./icons";

interface TopBarProps {
  saving: boolean;
  theme: Theme;
  focusMode: boolean;
  onSetTheme: (theme: Theme) => void;
  onCreate: () => void;
  onSetFocusMode: (value: boolean) => void;
  onSave: () => void;
  onExport: () => void;
  installAvailable: boolean;
  onInstall: () => void;
  mobilePanel: "notes" | "settings" | null;
  onToggleNotes: () => void;
  onToggleSettings: () => void;
}

export function TopBar({
  saving,
  theme,
  focusMode,
  onSetTheme,
  onCreate,
  onSetFocusMode,
  onSave,
  onExport,
  installAvailable,
  onInstall,
  mobilePanel,
  onToggleNotes,
  onToggleSettings,
}: TopBarProps) {
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    const first = menuRootRef.current?.querySelector<HTMLButtonElement>('[role^="menuitem"]');
    window.setTimeout(() => first?.focus(), 0);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const run = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  const handleMenuKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]'),
    );
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    else if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    items[next]?.focus();
  };

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center gap-2 sm:gap-4 border-b border-black/5 px-5 dark:border-white/5">
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <FeatherIcon className="opacity-70" />
        <span className="font-serif text-[15px] tracking-wide">{APP_NAME}</span>
      </div>
      <div className="flex-1" />
      {!focusMode && <button type="button" aria-label="ノート一覧" aria-expanded={mobilePanel === "notes"} onClick={onToggleNotes} className={`rounded-md p-2 text-neutral-500 transition-colors md:hidden ${mobilePanel === "notes" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}><FolderIcon /></button>}
      {!focusMode && <button type="button" aria-label="設定" aria-expanded={mobilePanel === "settings"} onClick={onToggleSettings} className={`rounded-md p-2 text-neutral-500 transition-colors xl:hidden ${mobilePanel === "settings" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}><ImageIcon /></button>}
      <div className="hidden items-center gap-1.5 text-[13px] sm:flex text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {saving ? <><SaveIcon className="opacity-60" /><span>保存中…</span></> : <><CheckIcon className="opacity-60" /><span>保存済み</span></>}
      </div>
      <button onClick={onSave} className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 transition hover:bg-black/5 active:scale-[0.97] dark:text-neutral-300 dark:hover:bg-white/5 md:flex">
        <SaveIcon className="opacity-70" />保存
      </button>
      <button onClick={onExport} className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 transition hover:bg-black/5 active:scale-[0.97] dark:text-neutral-300 dark:hover:bg-white/5 md:flex">
        <ExportIcon className="opacity-70" />エクスポート
      </button>
      <div ref={menuRootRef} className="relative">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="メニュー"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="app-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
        >
          <MenuIcon />
        </button>
        {menuOpen && (
          <div
            id="app-menu"
            role="menu"
            aria-label="アプリケーションメニュー"
            onKeyDown={handleMenuKeys}
            className="absolute right-0 top-full mt-2 w-[min(14rem,calc(100vw-1.5rem))] rounded-xl border border-black/10 bg-paper-panel p-1.5 text-[13px] text-neutral-700 shadow-xl dark:border-white/10 dark:bg-ink-panel dark:text-neutral-200"
          >
            <MenuItem icon={<PlusIcon />} label="新規ノート" onClick={() => run(onCreate)} />
            <MenuItem icon={<SaveIcon />} label="保存" onClick={() => run(onSave)} />
            <MenuItem icon={<ExportIcon />} label="エクスポート" onClick={() => run(onExport)} />
            {installAvailable && <MenuItem icon={<FeatherIcon width={16} height={16} />} label="Seionをインストール" onClick={() => run(onInstall)} />}
            <div className="my-1 border-t border-black/5 dark:border-white/5" />
            <MenuItem
              icon={<FeatherIcon width={16} height={16} />}
              label={focusMode ? "集中モードを終了" : "集中モード"}
              checked={focusMode}
              onClick={() => run(() => onSetFocusMode(!focusMode))}
            />
            <MenuItem
              icon={theme === "light" ? <MoonIcon /> : <SunIcon />}
              label={theme === "light" ? "ダークテーマ" : "ライトテーマ"}
              onClick={() => run(() => onSetTheme(theme === "light" ? "dark" : "light"))}
            />
            <MenuItem icon={<InfoIcon />} label="クレジット" onClick={() => run(() => setCreditsOpen(true))} />
          </div>
        )}
      </div>
      <CreditsDialog open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </header>
  );
}

function MenuItem({
  icon,
  label,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  checked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/5 focus:bg-black/5 dark:hover:bg-white/5 dark:focus:bg-white/5"
    >
      <span className="text-neutral-400">{icon}</span>
      <span className="flex-1">{label}</span>
      {checked && <CheckIcon width={14} height={14} />}
    </button>
  );
}