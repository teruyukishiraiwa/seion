import { useEffect, useMemo, useState } from "react";
import type { Note } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { FolderIcon, GridIcon, PlusIcon, SearchIcon, TrashIcon } from "./icons";

interface SidebarProps {
  notes: Note[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onEmptyTrash: () => void;
}

type Section = "notes" | "trash";
type Layout = "list" | "grid";
type ConfirmAction =
  | { type: "trash" | "delete"; note: Note }
  | { type: "empty" }
  | null;

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function preview(body: string): string {
  return body.split("\n").find((line) => line.trim())?.trim() || "本文なし";
}

export function Sidebar(props: SidebarProps) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("notes");
  const [layout, setLayout] = useState<Layout>("list");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const sectionNotes = useMemo(
    () => props.notes.filter((note) => section === "trash" ? note.trashedAt != null : note.trashedAt == null),
    [props.notes, section],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sectionNotes;
    return sectionNotes.filter(
      (note) => note.title.toLowerCase().includes(normalized) || note.body.toLowerCase().includes(normalized),
    );
  }, [query, sectionNotes]);
  const trashCount = props.notes.filter((note) => note.trashedAt != null).length;

  useEffect(() => {
    const selected = props.notes.find((note) => note.id === props.selectedId);
    if (selected && selected.trashedAt == null) setSection("notes");
  }, [props.notes, props.selectedId]);

  const confirmCopy =
    confirmAction?.type === "trash"
      ? { title: "ノートをゴミ箱へ移動", message: `「${confirmAction.note.title || "無題のノート"}」をゴミ箱へ移動しますか？`, label: "移動" }
      : confirmAction?.type === "delete"
        ? { title: "ノートを完全に削除", message: `「${confirmAction.note.title || "無題のノート"}」を完全に削除します。この操作は取り消せません。`, label: "完全に削除" }
        : { title: "ゴミ箱を空にする", message: "ゴミ箱内のすべてのノートを完全に削除します。この操作は取り消せません。", label: "すべて削除" };

  return (
    <aside className="flex w-full shrink-0 flex-col md:w-60 lg:w-72 border-r border-black/5 bg-paper-panel md:bg-paper-soft/40 motion-safe:animate-fadeIn dark:border-white/5 dark:bg-ink-panel md:dark:bg-ink-soft/40">
      <div className="space-y-3 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => { setSection("notes"); props.onCreate(); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-paper-panel py-2.5 text-[13px] text-neutral-700 shadow-sm transition hover:bg-black/[0.03] active:scale-[0.99] dark:border-white/10 dark:bg-ink-panel dark:text-neutral-200 dark:hover:bg-white/5"
        >
          <PlusIcon />新規ノート
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-paper-panel px-3 py-2 dark:border-white/10 dark:bg-ink-panel">
          <SearchIcon className="shrink-0 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={section === "trash" ? "ゴミ箱を検索" : "ノートを検索"}
            placeholder="検索"
            className="w-full bg-transparent text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-200"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-2 text-[12px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          {section === "trash" ? <TrashIcon className="opacity-70" /> : <FolderIcon className="opacity-70" />}
          {section === "trash" ? "ゴミ箱" : "ノート"}
        </span>
        <span>{sectionNotes.length}</span>
      </div>

      {section === "trash" && trashCount > 0 && (
        <button type="button" onClick={() => setConfirmAction({ type: "empty" })} className="mx-4 mb-2 self-end text-[11px] text-neutral-400 underline-offset-2 hover:text-red-600 hover:underline">
          ゴミ箱を空にする
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-neutral-400">
            {section === "trash" ? "ゴミ箱は空です" : "ノートが見つかりません"}
          </p>
        ) : (
          <ul className={layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-0.5"}>
            {filtered.map((note) => {
              const active = note.id === props.selectedId;
              return (
                <li key={note.id} className="group relative min-w-0">
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => props.onSelect(note.id)}
                    className={`block w-full rounded-lg text-left transition ${layout === "grid" ? "min-h-28 px-2.5 py-2" : "px-3 py-2.5"} ${active ? "bg-paper-panel shadow-sm ring-1 ring-black/5 dark:bg-ink-panel dark:ring-white/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"}`}
                  >
                    <span className="block truncate pr-5 font-serif text-[14px] text-neutral-800 dark:text-neutral-100">{note.title || "無題のノート"}</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-400">{formatDate(note.trashedAt ?? note.updatedAt)}</span>
                    <span className={`mt-1 text-[12px] text-neutral-500 dark:text-neutral-400 ${layout === "grid" ? "line-clamp-3 break-all" : "block truncate"}`}>{preview(note.body)}</span>
                  </button>
                  {section === "trash" ? (
                    <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <button type="button" aria-label="ノートを復元" title="復元" onClick={() => props.onRestore(note.id)} className="rounded bg-paper-panel p-1 text-neutral-400 shadow-sm hover:text-neutral-700 dark:bg-ink-panel dark:hover:text-neutral-100"><FolderIcon width={13} height={13} /></button>
                      <button type="button" aria-label="ノートを完全に削除" title="完全に削除" onClick={() => setConfirmAction({ type: "delete", note })} className="rounded bg-paper-panel p-1 text-neutral-400 shadow-sm hover:text-red-600 dark:bg-ink-panel"><TrashIcon width={13} height={13} /></button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label="ノートをゴミ箱へ移動"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmAction({ type: "trash", note });
                      }}
                      className="absolute right-1 top-1 z-10 flex h-10 w-10 items-center md:h-8 md:w-8 justify-center rounded-md text-neutral-400 opacity-100 transition md:text-neutral-300 md:opacity-0 hover:bg-black/5 hover:text-neutral-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-neutral-600 dark:hover:bg-white/5 dark:hover:text-neutral-300"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-black/5 px-4 py-3 text-neutral-400 dark:border-white/5">
        <button type="button" aria-label="通常のノート一覧" aria-pressed={section === "notes"} onClick={() => setSection("notes")} className={bottomButton(section === "notes")}><FolderIcon /></button>
        <button type="button" aria-label={`ゴミ箱（${trashCount}件）`} aria-pressed={section === "trash"} onClick={() => setSection("trash")} className={bottomButton(section === "trash")}><TrashIcon /></button>
        <button type="button" aria-label={layout === "list" ? "カード表示に切り替え" : "リスト表示に切り替え"} aria-pressed={layout === "grid"} onClick={() => setLayout((value) => value === "list" ? "grid" : "list")} className={bottomButton(layout === "grid")}><GridIcon /></button>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.label}
        danger={confirmAction?.type !== "trash"}
        onConfirm={() => {
          if (confirmAction?.type === "trash") props.onTrash(confirmAction.note.id);
          if (confirmAction?.type === "delete") props.onDeletePermanently(confirmAction.note.id);
          if (confirmAction?.type === "empty") props.onEmptyTrash();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </aside>
  );
}

function bottomButton(active: boolean): string {
  return `rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/5 dark:hover:text-neutral-200 ${active ? "bg-black/5 text-neutral-700 dark:bg-white/10 dark:text-neutral-100" : ""}`;
}