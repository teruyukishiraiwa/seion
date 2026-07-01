import type { Settings } from "../types";
import { cardGeometry } from "./cardGeometry";

const REFERENCE_EDGE = 1080;

export function backgroundBlurForCard(settings: Settings): number {
  return settings.backgroundBlur * (cardGeometry(settings.aspect).min / REFERENCE_EDGE);
}

export function backgroundScaleForCard(settings: Settings): number {
  const geometry = cardGeometry(settings.aspect);
  return 1 + (backgroundBlurForCard(settings) * 4) / geometry.min;
}

export function backgroundBlurForEditor(settings: Settings): number {
  return settings.backgroundBlur * (settings.contentWidth / REFERENCE_EDGE);
}

export function backgroundScaleForEditor(settings: Settings): number {
  return 1 + (backgroundBlurForEditor(settings) * 4) / settings.contentWidth;
}