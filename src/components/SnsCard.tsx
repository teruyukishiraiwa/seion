import { forwardRef } from "react";
import type { CardPage, Note, Settings } from "../types";
import { APP_NAME, FONT_STACKS, hasActiveBackground } from "../constants";
import { cardGeometry } from "../lib/cardGeometry";
import { getBodyHtml } from "../lib/richText";
import { signatureMarginForCard, signatureWidthForCard } from "../lib/signatureGeometry";
import { backgroundBlurForCard, backgroundScaleForCard } from "../lib/backgroundGeometry";

interface SnsCardProps {
  note: Note | null;
  settings: Settings;
  /** Render at this scale (1 = full export resolution). */
  scale?: number;
  /**
   * When set, render just this paginated page instead of the whole body.
   * The title shows only when `page.showTitle` is true, and a `1 / N`
   * indicator appears for multi-page sets.
   */
  page?: CardPage | null;
}

/**
 * Renders the SNS export card at full output resolution. A CSS transform
 * (`scale`) shrinks it for inline preview, while the export path renders it
 * at scale 1 off-screen and rasterises it to PNG.
 */
export const SnsCard = forwardRef<HTMLDivElement, SnsCardProps>(
  ({ note, settings, scale = 1, page = null }, ref) => {
    // Single source of truth for card dimensions — shared with the pagination
    // logic so "what fits on a card" always matches what is drawn here.
    const g = cardGeometry(settings.aspect);
    const { w, h, padding, titleSize, bodySize, footerSize } = g;

    const bodyHtml = page ? page.body : getBodyHtml(note);
    const showTitle = page ? page.showTitle : true;
    const indicator =
      page && page.total > 1 ? `${page.index + 1} / ${page.total}` : null;

    const showSignature =
      settings.signatureEnabled &&
      settings.signatureImage != null &&
      (page == null || page.index === page.total - 1);

    const isDarkOverlay = settings.overlayColor === "dark";
    const textColor = isDarkOverlay ? "#f3f0ea" : "#2b2a28";
    const subColor = isDarkOverlay
      ? "rgba(243,240,234,0.65)"
      : "rgba(43,42,40,0.55)";

    // Base background when no image is set.
    const baseBg = isDarkOverlay
      ? "linear-gradient(160deg, #2b2a28 0%, #1c1b1a 100%)"
      : "linear-gradient(160deg, #ffffff 0%, #f3f0ea 100%)";

    const overlayRgb = isDarkOverlay ? "0,0,0" : "255,255,255";
    const showBackground = hasActiveBackground(settings);

    return (
      <div
        style={{
          width: w * scale,
          height: h * scale,
          overflow: "hidden",
          borderRadius: scale < 1 ? 8 : 0,
        }}
      >
        <div
          ref={ref}
          className={`layer-${settings.overlayColor}`}
          style={{
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            background: baseBg,
            overflow: "hidden",
          }}
        >
          {/* Background image */}
          {showBackground && (
            <img
              src={settings.backgroundImage as string}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${settings.backgroundPosX}% ${settings.backgroundPosY}%`,
                filter: settings.backgroundBlur > 0 ? `blur(${backgroundBlurForCard(settings)}px)` : undefined,
                transform: `scale(${backgroundScaleForCard(settings)})`,
              }}
            />
          )}
          {/* Legibility overlay */}
          {showBackground && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `rgba(${overlayRgb}, ${settings.overlayOpacity})`,
              }}
            />
          )}

          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              // Reserve the lower strip for the signature so long bodies clip
              // cleanly above it rather than overlapping it.
              bottom: padding,
              display: "flex",
              flexDirection: "column",
              justifyContent: settings.aspect === "9:16" ? "center" : "flex-start",
              padding,
              overflow: "hidden",
              fontFamily: FONT_STACKS[settings.font],
              textAlign: settings.snsTextAlign,
              alignItems:
                settings.snsTextAlign === "center" ? "center" : "flex-start",
            }}
          >
            {showTitle && (
              <h2
                style={{
                  margin: 0,
                  marginBottom: g.titleMarginBottom,
                  fontSize: titleSize,
                  fontWeight: 500,
                  letterSpacing: `${g.titleLetterSpacing}em`,
                  color: textColor,
                  lineHeight: g.titleLineHeight,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {note?.title || "無題"}
              </h2>
            )}
            <div
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontSize: bodySize,
                lineHeight: g.bodyLineHeight,
                letterSpacing: `${g.bodyLetterSpacing}em`,
                color: textColor,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />            {showSignature && (
              <img
                src={settings.signatureImage as string}
                alt=""
                style={{
                  display: "block",
                  width: signatureWidthForCard(settings),
                  height: "auto",
                  maxWidth: "100%",
                  marginTop: signatureMarginForCard(settings),
                  marginLeft: "auto",
                  alignSelf: "flex-end",
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          {/* Signature */}
          <div
            style={{
              position: "absolute",
              bottom: padding * 0.55,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: FONT_STACKS.serif,
              fontSize: footerSize,
              letterSpacing: "0.18em",
              color: subColor,
            }}
          >
            {APP_NAME}
          </div>

          {/* Page indicator (multi-page exports only) */}
          {indicator && (
            <div
              style={{
                position: "absolute",
                bottom: padding * 0.55,
                right: padding,
                fontFamily: FONT_STACKS.serif,
                fontSize: footerSize * 0.95,
                letterSpacing: "0.12em",
                color: subColor,
              }}
            >
              {indicator}
            </div>
          )}
        </div>
      </div>
    );
  },
);

SnsCard.displayName = "SnsCard";
