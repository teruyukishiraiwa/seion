export interface Note {
  id: string;
  title: string;
  /** Plain-text body — used for search, list previews and character counts. */
  body: string;
  /** Canonical rich-text body (block HTML). Derived from `body` when absent. */
  bodyHtml?: string;
  createdAt: number;
  updatedAt: number;
  /** Set while the note is in the trash. */
  trashedAt?: number;
  /** Per-note output and writing parameters. App display preferences stay global. */
  settings?: Partial<ArticleSettings>;
}

export type FontKey = "mincho" | "gothic" | "serif" | "sans";

export type Theme = "light" | "dark";

export type AspectRatio = "1:1" | "9:16" | "16:9";

export type TextAlign = "center" | "left";

export interface Settings {
  font: FontKey;
  fontSize: number; // px, body text in editor
  lineHeight: number; // unitless multiplier
  letterSpacing: number; // em
  contentWidth: number; // px, editor column width
  theme: Theme;
  aspect: AspectRatio;
  /** Display the writing surface at the selected export aspect ratio. */
  editorAspectMode: boolean;
  /** data URL of the uploaded background image, or null */
  backgroundImage: string | null;
  /** Master switch: show the background everywhere (editor + SNS card). */
  backgroundEnabled: boolean;
  /** Background focal point, 0..100 (% object-position), shared everywhere. */
  backgroundPosX: number;
  backgroundPosY: number;
  /** Gaussian blur strength for the background image, 0..40. */
  backgroundBlur: number;
  /** overlay opacity 0..1 over the background for legibility */
  overlayOpacity: number;
  /** "light" => white overlay, "dark" => black overlay */
  overlayColor: "light" | "dark";
  snsTextAlign: TextAlign;
  /** Split long bodies across multiple SNS cards instead of clipping. */
  splitPages: boolean;
  /** Show the note title on the SNS card / export (editor title input unaffected). */
  cardTitleEnabled: boolean;
  /** Optional author signature rendered at the end of the body. */
  signatureImage: string | null;
  signatureEnabled: boolean;
  signatureWidth: number;
  signatureMarginTop: number;
  signatureAspectRatio: number;
}

export type AppSettingsKey = "theme" | "editorAspectMode";

export type ArticleSettings = Omit<Settings, AppSettingsKey>;

/** One paginated SNS card's worth of content. */
export interface CardPage {
  body: string;
  showTitle: boolean;
  index: number;
  total: number;
}
