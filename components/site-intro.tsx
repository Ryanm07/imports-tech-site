"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND_ASSETS } from "@/lib/brand";
import { shouldShowIntro } from "@/lib/intro";

const SESSION_KEY = "imports-tech:intro-seen:v1";

export function SiteIntro({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
      closingRef.current = false;
      previousFocus.current?.focus();
    }, 220);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const replay =
      new URLSearchParams(window.location.search).get("intro") === "replay";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}
    const baseInput = {
      enabled,
      replay,
      seenThisSession: seen,
      reducedMotion: reduced,
      saveData: Boolean(connection?.saveData),
      effectiveType: connection?.effectiveType,
    };
    if (!shouldShowIntro({ ...baseInput, hasPlayableAsset: true })) return;
    let cancelled = false;
    Promise.all([
      fetch(BRAND_ASSETS.introWebm, { method: "HEAD", cache: "force-cache" }),
      fetch(BRAND_ASSETS.introMp4, { method: "HEAD", cache: "force-cache" }),
    ])
      .then((responses) => {
        if (
          !cancelled &&
          shouldShowIntro({
            ...baseInput,
            hasPlayableAsset: responses.some((response) => response.ok),
          })
        )
          previousFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skip.current?.focus();
    const timeout = window.setTimeout(close, 12_000);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", escape);
    void video.current?.play().catch(close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", escape);
    };
  }, [close, visible]);

  if (!visible) return null;
  return (
    <div
      className={`site-intro${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura Imports Tech"
    >
      <video
        ref={video}
        muted
        playsInline
        preload="metadata"
        poster={BRAND_ASSETS.introPoster}
        onEnded={close}
        onError={close}
      >
        <source src={BRAND_ASSETS.introWebm} type="video/webm" />
        <source src={BRAND_ASSETS.introMp4} type="video/mp4" />
      </video>
      <button ref={skip} type="button" onClick={close}>
        Pular intro
      </button>
    </div>
  );
}
