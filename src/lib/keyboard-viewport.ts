"use client";

import { useEffect, useState } from "react";

const KEYBOARD_VISIBLE_THRESHOLD_PX = 80;
const KEYBOARD_SCROLL_DELAY_MS = 300;
/** Matches `--bottom-nav-height` (3.75rem) in globals.css */
const BOTTOM_NAV_HEIGHT_PX = 60;

function getScrollBottomPadding(basePadding: number): number {
  return basePadding + (isKeyboardVisible() ? 0 : BOTTOM_NAV_HEIGHT_PX);
}

export function getKeyboardInset(): number {
  if (typeof window === "undefined") return 0;

  const viewport = window.visualViewport;
  if (!viewport) return 0;

  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
}

export function isKeyboardVisible(threshold = KEYBOARD_VISIBLE_THRESHOLD_PX): boolean {
  return getKeyboardInset() > threshold;
}

type ScrollAboveKeyboardOptions = {
  behavior?: ScrollBehavior;
  padding?: number;
};

export function scrollElementAboveKeyboard(
  el: HTMLElement | null,
  { behavior = "smooth", padding = 16 }: ScrollAboveKeyboardOptions = {},
): void {
  if (!el) return;

  const viewport = window.visualViewport;
  if (!viewport) {
    const bottomPadding = getScrollBottomPadding(padding);
    el.scrollIntoView({ behavior, block: "end" });
    if (bottomPadding > padding) {
      window.scrollBy({ top: bottomPadding - padding, behavior });
    }
    return;
  }

  const rect = el.getBoundingClientRect();
  const visibleBottom = viewport.offsetTop + viewport.height;
  const bottomPadding = getScrollBottomPadding(padding);

  if (rect.bottom > visibleBottom - bottomPadding) {
    const delta = rect.bottom - (visibleBottom - bottomPadding);
    window.scrollBy({ top: delta, behavior });
  }
}

export function scheduleScrollAboveKeyboard(
  el: HTMLElement | null,
  options?: ScrollAboveKeyboardOptions,
): void {
  if (!el) return;

  const scroll = () => scrollElementAboveKeyboard(el, options);

  scroll();

  const timeoutId = window.setTimeout(scroll, KEYBOARD_SCROLL_DELAY_MS);

  const viewport = window.visualViewport;
  if (!viewport) return;

  const onResize = () => {
    scroll();
    viewport.removeEventListener("resize", onResize);
  };

  viewport.addEventListener("resize", onResize);

  window.setTimeout(() => {
    viewport.removeEventListener("resize", onResize);
  }, KEYBOARD_SCROLL_DELAY_MS + 100);
}

export function useKeyboardVisible(threshold = KEYBOARD_VISIBLE_THRESHOLD_PX): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      setVisible(isKeyboardVisible(threshold));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [threshold]);

  return visible;
}
