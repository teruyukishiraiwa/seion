import type { AspectRatio, FontKey, Note, Settings } from "./types";

export const STORAGE_KEYS = {
  notes: "seion:notes",
  settings: "seion:settings",
  selectedId: "seion:selected",
} as const;

/** Legacy localStorage keys (pre-rename); migrated once on startup. */
export const LEGACY_STORAGE_KEYS = {
  notes: "quiet-manuscript:notes",
  settings: "quiet-manuscript:settings",
  selectedId: "quiet-manuscript:selected",
} as const;

export const FONT_STACKS: Record<FontKey, string> = {
  mincho:
    '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", serif',
  gothic:
    '"Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  sans: "Inter, system-ui, sans-serif",
};

export const FONT_LABELS: Record<FontKey, string> = {
  mincho: "明朝系",
  gothic: "ゴシック系",
  serif: "Serif",
  sans: "Sans",
};

/** Output pixel dimensions for PNG export, keyed by aspect ratio. */
export const EXPORT_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
};

export const DEFAULT_SETTINGS: Settings = {
  font: "mincho",
  fontSize: 16,
  lineHeight: 1.9,
  letterSpacing: 0.04,
  contentWidth: 640,
  theme: "light",
  aspect: "9:16",
  editorAspectMode: false,
  backgroundImage: null,
  backgroundEnabled: true,
  backgroundPosX: 50,
  backgroundPosY: 50,
  backgroundBlur: 0,
  overlayOpacity: 0.35,
  overlayColor: "light",
  snsTextAlign: "left",
  splitPages: false,
  signatureImage: null,
  signatureEnabled: true,
  signatureWidth: 173,
  signatureMarginTop: 35,
  signatureAspectRatio: 2.5,
};

/** Whether a background image should currently be shown anywhere. */
export function hasActiveBackground(settings: Settings): boolean {
  return settings.backgroundEnabled && settings.backgroundImage != null;
}

export const APP_NAME = "Seion";

const SAMPLE_BODY = `Seionは、言葉を置くための静かな空間です。

まだ名前のない思いや、ふと胸をよぎった風景を、急いで結論にしなくてもいい。
余白の中に一行ずつ置いていけば、かすかな声にも輪郭が生まれます。

背景や文字の佇まいを整え、必要なら署名を添えて、そのまま一枚の画像へ。
日記も、詩も、短い手紙も、ここでは同じ静けさの中にあります。

書くことは、心の奥に耳を澄ますこと。
どうぞ、あなたの言葉を静かに始めてください。`;

export function createSampleNotes(): Note[] {
  const createdAt = new Date("2026-01-01").getTime();
  return [
    {
      id: "note-welcome-to-seion",
      title: "静けさに、言葉を置く",
      body: SAMPLE_BODY,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}