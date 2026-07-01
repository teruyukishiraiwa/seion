import type { Settings } from "../types";
import { cardGeometry } from "./cardGeometry";

const REFERENCE_INNER_WIDTH = cardGeometry("9:16").innerWidth;

export function signatureWidthRatio(settings: Settings): number {
  return settings.signatureWidth / REFERENCE_INNER_WIDTH;
}

export function signatureMarginRatio(settings: Settings): number {
  return settings.signatureMarginTop / REFERENCE_INNER_WIDTH;
}

export function signatureWidthForCard(settings: Settings): number {
  return cardGeometry(settings.aspect).innerWidth * signatureWidthRatio(settings);
}

export function signatureMarginForCard(settings: Settings): number {
  return cardGeometry(settings.aspect).innerWidth * signatureMarginRatio(settings);
}