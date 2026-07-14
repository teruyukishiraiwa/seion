import { useEffect, useRef } from "react";
import { APP_NAME } from "../constants";
import profileUrl from "../assets/credits/profile_teruyuki_shiraiwa.jpg";
import signatureUrl from "../assets/credits/signature_tshiraiwa.png";
import { CloseIcon, ExternalLinkIcon, GithubIcon } from "./icons";

const CREATOR_NAME_JA = "白岩晃行";
const CREATOR_NAME_EN = "Teruyuki Shiraiwa";
const CREATOR_WEBSITE = "https://teruyukishiraiwa.art/";
const GITHUB_REPOSITORY = "https://github.com/teruyukishiraiwa/seion";

interface CreditsDialogProps { open: boolean; onClose: () => void; }

export function CreditsDialog({ open, onClose }: CreditsDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="presentation" onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[6px] motion-safe:animate-overlayIn dark:bg-black/65 sm:items-center sm:p-7">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="credits-title" onClick={(event) => event.stopPropagation()} className="relative my-auto max-h-[calc(100dvh_-_2rem)] w-full max-w-[590px] overflow-y-auto rounded-[20px] border border-black/[0.09] bg-paper-panel shadow-[0_28px_80px_rgba(39,37,32,0.24)] motion-safe:animate-dialogIn dark:border-white/[0.08] dark:bg-ink-panel dark:shadow-[0_30px_90px_rgba(0,0,0,0.58)] sm:rounded-[22px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(180,157,111,0.14),transparent_43%)] dark:bg-[radial-gradient(circle_at_14%_0%,rgba(213,195,157,0.09),transparent_45%)]" />
        <div className="relative p-5 sm:p-8">
          <header className="flex items-start justify-between gap-4 sm:gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-400 sm:text-[10px]"><span>{APP_NAME} / 静音</span><span className="h-px w-4 bg-black/15 dark:bg-white/15" /><span>v1.1.1</span></div>
              <h2 id="credits-title" className="mt-2.5 font-serif text-[23px] font-medium tracking-[0.04em] text-neutral-800 dark:text-neutral-100 sm:mt-3 sm:text-[27px]">Credits</h2>
              <p className="mt-1.5 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400 sm:mt-2 sm:text-[12px] sm:leading-6">言葉を置くための、静かな空間。<br />設計、開発、創作の記録。</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="クレジットを閉じる" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white/25 text-neutral-400 transition hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:text-neutral-100 sm:h-9 sm:w-9"><CloseIcon /></button>
          </header>

          <div className="mt-5 grid grid-cols-[104px_minmax(0,1fr)] items-center gap-x-5 gap-y-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.06] sm:mt-7 sm:grid-cols-[minmax(0,1fr)_176px] sm:gap-7 sm:pt-7">
            <figure className="relative order-1 w-full sm:order-2">
              <div aria-hidden className="absolute -inset-1.5 rounded-[16px] border border-black/[0.05] dark:border-white/[0.06] sm:-inset-2 sm:rounded-[18px]" />
              <img src={profileUrl} alt={`${CREATOR_NAME_EN}のポートレート`} className="relative h-auto w-full rounded-[11px] object-contain grayscale-[18%] contrast-[1.02] sm:rounded-[13px]" />
            </figure>

            <div className="order-2 min-w-0 sm:order-1">
              <p className="text-[9px] font-medium uppercase tracking-[0.13em] text-neutral-400 sm:text-[10px] sm:tracking-[0.16em]">Created &amp; designed by</p>
              <p className="mt-1.5 font-serif text-[17px] tracking-[0.05em] text-neutral-800 dark:text-neutral-100 sm:mt-2 sm:text-[18px]">{CREATOR_NAME_JA}</p>
              <p className="mt-1 text-[10px] tracking-[0.04em] text-neutral-400 sm:text-[11px] sm:tracking-[0.06em]">{CREATOR_NAME_EN}</p>
              <img src={signatureUrl} alt={`${CREATOR_NAME_EN}の署名`} className="mt-4 block w-[135px] max-w-full opacity-80 invert dark:opacity-75 dark:invert-0 sm:mt-7 sm:w-[220px] sm:max-w-[75%]" />
              <nav aria-label="クレジットリンク" className="mt-5 hidden gap-2 sm:grid sm:max-w-[290px]">
                <CreditLinks />
              </nav>
            </div>

            <nav aria-label="クレジットリンク（モバイル）" className="order-3 col-span-2 grid gap-2 sm:hidden">
              <CreditLinks />
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
}

function CreditLinks() {
  return <><CreditLink href={CREATOR_WEBSITE} icon={<ExternalLinkIcon width={14} height={14} />} label="Official website" detail="teruyukishiraiwa.art" /><CreditLink href={GITHUB_REPOSITORY} icon={<GithubIcon width={14} height={14} />} label="GitHub repository" detail="teruyukishiraiwa / seion" /></>;
}

function CreditLink({ href, icon, label, detail }: { href: string; icon: React.ReactNode; label: string; detail: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex min-h-11 items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.015] px-3.5 py-2.5 transition hover:border-black/15 hover:bg-black/[0.03] dark:border-white/[0.07] dark:bg-white/[0.015] dark:hover:border-white/15 dark:hover:bg-white/[0.04]">
      <span className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200">{icon}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium tracking-[0.03em] text-neutral-600 dark:text-neutral-300">{label}</span><span className="mt-0.5 block truncate text-[9px] tracking-[0.04em] text-neutral-400">{detail}</span></span><span aria-hidden className="text-[13px] text-neutral-300 group-hover:translate-x-0.5 dark:text-neutral-600">↗</span>
    </a>
  );
}
