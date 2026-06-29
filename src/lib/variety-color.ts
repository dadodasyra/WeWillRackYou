import type { CSSProperties } from "react";
import * as THREE from "three";

export type VarietyColorProps = {
  color: string;
  isBarred?: boolean;
};

/** Luminance relative (sRGB) — seuil empirique pour choisir la couleur des rayures. */
export function isDarkColor(hex: string): boolean {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return true;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance < 0.35;
}

export function getStripeRgba(hex: string): string {
  return isDarkColor(hex) ? "rgba(255, 255, 255, 0.62)" : "rgba(0, 0, 0, 0.42)";
}

/** Pastille CSS avec rayures diagonales optionnelles. */
export function varietySwatchStyle({
  color,
  isBarred = false,
  size,
}: VarietyColorProps & { size?: string }): CSSProperties {
  if (!isBarred) {
    return {
      backgroundColor: color,
      ...(size ? { width: size, height: size } : {}),
    };
  }

  const stripe = getStripeRgba(color);

  return {
    backgroundColor: color,
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      ${stripe} 3px,
      ${stripe} 5px
    )`,
    ...(size ? { width: size, height: size } : {}),
  };
}

const textureCache = new Map<string, THREE.CanvasTexture>();

/** Texture Three.js avec rayures diagonales pour les variétés « barrées ». */
export function getStripedVarietyTexture(color: string, isBarred: boolean): THREE.CanvasTexture | null {
  if (!isBarred) return null;

  const dark = isDarkColor(color);
  const key = `${color.toLowerCase()}-${dark ? "light" : "dark"}-stripes`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.62)" : "rgba(0, 0, 0, 0.42)";
  ctx.lineWidth = 4;
  for (let offset = -size; offset < size * 2; offset += 10) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function getVarietyEmissive(hex: string): string {
  const color = new THREE.Color(hex);
  color.multiplyScalar(0.35);
  return `#${color.getHexString()}`;
}
