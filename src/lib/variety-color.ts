import type { CSSProperties } from "react";
import * as THREE from "three";

export type VarietyColorProps = {
  color: string;
  isBarred?: boolean;
};

/** Luminance relative (sRGB) - seuil empirique pour choisir la couleur des rayures. */
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
  return isDarkColor(hex) ? "rgba(255, 255, 255, 0.38)" : "rgba(0, 0, 0, 0.28)";
}

/** Pastille CSS avec fines rayures diagonales (couleur dominante). */
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
      transparent 7px,
      ${stripe} 7px,
      ${stripe} 8px
    )`,
    ...(size ? { width: size, height: size } : {}),
  };
}

const textureCacheByContext = new WeakMap<
  WebGLRenderingContext,
  Map<string, THREE.CanvasTexture>
>();

function getContextTextureCache(
  gl: WebGLRenderingContext,
): Map<string, THREE.CanvasTexture> {
  let cache = textureCacheByContext.get(gl);
  if (!cache) {
    cache = new Map();
    textureCacheByContext.set(gl, cache);
  }
  return cache;
}

function createCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawDiagonalStripes(
  ctx: CanvasRenderingContext2D,
  size: number,
  stripeColor: string,
  lineWidth: number,
  step: number,
) {
  ctx.strokeStyle = stripeColor;
  ctx.lineWidth = lineWidth;
  for (let offset = -size; offset < size * 2; offset += step) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }
}

/** Texture Three.js - rayures visibles à distance (peu de répétitions sur la face). */
export function getStripedVarietyTexture(
  color: string,
  isBarred: boolean,
  gl?: WebGLRenderingContext | null,
): THREE.CanvasTexture | null {
  if (!isBarred || !gl) return null;

  const dark = isDarkColor(color);
  const key = `v5-${color.toLowerCase()}-${dark ? "w" : "b"}`;
  const textureCache = getContextTextureCache(gl);
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  drawDiagonalStripes(
    ctx,
    size,
    dark ? "rgba(255, 255, 255, 0.52)" : "rgba(0, 0, 0, 0.38)",
    3,
    18,
  );

  const texture = createCanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

export function getVarietyEmissive(hex: string): string {
  const color = new THREE.Color(hex);
  color.multiplyScalar(0.35);
  return `#${color.getHexString()}`;
}
