"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND_ASSETS } from "@/lib/brand";
import {
  INTRO_SESSION_KEY,
  mapIntroGeometry,
  shouldShowIntro,
} from "@/lib/intro";

type ReplayEvent = CustomEvent<{ sound?: boolean }>;

export function SiteIntro({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [soundRequested, setSoundRequested] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const flightLogo = useRef<HTMLDivElement>(null);
  const transitionRings = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const transitionStarted = useRef(false);
  const finishTimer = useRef<number | null>(null);
  const videoFrame = useRef<number | null>(null);
  const animations = useRef<Animation[]>([]);
  const isOpen = useRef(false);

  const openIntro = useCallback((sound: boolean) => {
    if (isOpen.current) return;
    isOpen.current = true;
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    transitionStarted.current = false;
    setPrepared(false);
    setTransitioning(false);
    setAudioBlocked(false);
    setPlaybackFailed(false);
    setSoundRequested(sound);
    setVisible(true);
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
    } catch {
      // Session storage is an enhancement; failure never blocks the home.
    }
  }, []);

  const showPlaybackFallback = useCallback(() => {
    video.current?.pause();
    setPrepared(true);
    setPlaybackFailed(true);
  }, []);

  const finish = useCallback(() => {
    isOpen.current = false;
    video.current?.pause();
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    if (finishTimer.current) window.clearTimeout(finishTimer.current);
    finishTimer.current = null;
    if (videoFrame.current !== null) {
      video.current?.cancelVideoFrameCallback?.(videoFrame.current);
      videoFrame.current = null;
    }
    document.body.classList.remove(
      "intro-active",
      "intro-transitioning",
      "intro-logo-flight",
    );
    setVisible(false);
    setTransitioning(false);
  }, []);

  const beginTransition = useCallback(
    (reduced = false) => {
      if (transitionStarted.current || !flightLogo.current) return;
      transitionStarted.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.dispatchEvent(
          new CustomEvent("imports-tech:intro-complete", {
            detail: { reduced: true },
          }),
        );
        finish();
        return;
      }
      setPrepared(true);
      setTransitioning(true);
      video.current?.pause();
      const geometry = mapIntroGeometry(window.innerWidth, window.innerHeight);
      const target = document.querySelector<HTMLElement>(
        "[data-intro-logo-target]",
      );
      const orbitTarget = document.querySelector<HTMLElement>(
        "[data-intro-orbit-target]",
      );
      const targetRect = target?.getBoundingClientRect();
      const orbitRect = orbitTarget?.getBoundingClientRect();
      const duration = reduced ? 380 : 760;

      document.body.classList.add("intro-transitioning", "intro-logo-flight");
      Object.assign(flightLogo.current.style, pxRect(geometry.logo));
      flightLogo.current.style.transformOrigin = "top left";
      animations.current.push(
        flightLogo.current.animate(
          [
            {
              transform: "translate(0, 0) scale(1, 1)",
              borderRadius: "2px",
              opacity: 1,
              filter: "drop-shadow(0 18px 26px rgba(0,0,0,.36))",
            },
            {
              transform: `translate(${(targetRect?.left ?? 24) - geometry.logo.left}px, ${(targetRect?.top ?? 16) - geometry.logo.top}px) scale(${(targetRect?.width ?? 44) / geometry.logo.width}, ${(targetRect?.height ?? 44) / geometry.logo.height})`,
              borderRadius: "11px",
              opacity: 1,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,.22))",
            },
          ],
          {
            duration,
            delay: reduced ? 20 : 120,
            easing: "cubic-bezier(.22,.82,.25,1)",
            fill: "forwards",
          },
        ),
      );

      if (transitionRings.current) {
        Object.assign(transitionRings.current.style, pxRect(geometry.rings));
        transitionRings.current.style.transformOrigin = "top left";
        animations.current.push(
          transitionRings.current.animate(
            [
              {
                opacity: 0.96,
                transform: "translate(0, 0) scale(1, 1) rotate(0deg)",
              },
              {
                opacity: orbitRect ? 0.26 : 0,
                transform: `translate(${(orbitRect?.left ?? geometry.rings.left) - geometry.rings.left}px, ${(orbitRect?.top ?? geometry.rings.top) - geometry.rings.top}px) scale(${(orbitRect?.width ?? geometry.rings.width) / geometry.rings.width}, ${(orbitRect?.height ?? geometry.rings.height) / geometry.rings.height}) rotate(24deg)`,
              },
            ],
            {
              duration: reduced ? 320 : 820,
              delay: reduced ? 0 : 80,
              easing: "cubic-bezier(.2,.75,.2,1)",
              fill: "forwards",
            },
          ),
        );
      }

      if (finishTimer.current) window.clearTimeout(finishTimer.current);
      finishTimer.current = window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent("imports-tech:intro-complete", {
              detail: { reduced },
            }),
          );
          if (flightLogo.current) flightLogo.current.style.opacity = "0";
          document.body.classList.remove("intro-logo-flight");
          finishTimer.current = window.setTimeout(finish, 80);
        },
        duration + (reduced ? 80 : 220),
      );
    },
    [finish],
  );

  useEffect(() => {
    if (!enabled) return;
    // Decide before rendering media: skipped sessions must not request intro assets.
    const params = new URLSearchParams(window.location.search);
    const replay = params.get("intro") === "replay";
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    let seenThisSession = false;
    try {
      seenThisSession = sessionStorage.getItem(INTRO_SESSION_KEY) === "seen";
    } catch {
      // A blocked storage API does not prevent entering the site.
    }
    const show = shouldShowIntro({
      enabled,
      replay: false,
      seenThisSession,
      reducedMotion,
      saveData: Boolean(connection?.saveData),
      effectiveType: connection?.effectiveType,
      hasPlayableAsset: true,
    });
    // Explicit replay is an opt-in, including when automatic playback is disabled.
    if (replay || (show && window.location.pathname === "/")) {
      openIntro(params.get("sound") === "1");
    }
  }, [enabled, openIntro]);

  useEffect(() => {
    const replay = (event: Event) => {
      if (!enabled) return;
      const detail = (event as ReplayEvent).detail;
      openIntro(Boolean(detail?.sound));
    };
    window.addEventListener("imports-tech:intro-replay", replay);
    return () =>
      window.removeEventListener("imports-tech:intro-replay", replay);
  }, [enabled, openIntro]);

  useEffect(() => {
    const overlay = dialog.current;
    if (!visible || !overlay) return;
    let active = true;
    document.body.classList.add("intro-active");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background: Array<{ element: HTMLElement; inert: boolean }> = [];
    let branch: HTMLElement = overlay;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    skip.current?.focus();
    const safety = window.setTimeout(() => beginTransition(true), 8_000);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginTransition(true);
      }
      if (event.key !== "Tab") return;
      const buttons = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = buttons[0];
      const last = buttons.at(-1);
      if (!first) {
        event.preventDefault();
        overlay.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !overlay.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !overlay.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !overlay.contains(event.target))
        skip.current?.focus();
    };
    window.addEventListener("keydown", escape);
    document.addEventListener("focusin", containFocus);

    const element = video.current;
    if (element) {
      element.currentTime = 0;
      element.muted = !soundRequested;
      void element.play().catch(() => {
        if (!active) return;
        if (soundRequested) {
          element.muted = true;
          setAudioBlocked(true);
          void element.play().catch(() => {
            if (active) showPlaybackFallback();
          });
        } else {
          showPlaybackFallback();
        }
      });
    }
    return () => {
      active = false;
      element?.pause();
      if (videoFrame.current !== null)
        element?.cancelVideoFrameCallback?.(videoFrame.current);
      videoFrame.current = null;
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      background.forEach(({ element: item, inert }) => {
        item.inert = inert;
      });
      document.body.classList.remove(
        "intro-active",
        "intro-transitioning",
        "intro-logo-flight",
      );
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(safety);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", containFocus);
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
      const restore = previousFocus.current;
      if (restore?.isConnected && restore !== document.body) {
        restore.focus({ preventScroll: true });
      }
    };
  }, [beginTransition, showPlaybackFallback, soundRequested, visible]);

  function monitorFrames() {
    const element = video.current as
      | (HTMLVideoElement & {
          requestVideoFrameCallback?: (
            callback: (_now: number, metadata: { mediaTime: number }) => void,
          ) => number;
        })
      | null;
    if (!element?.requestVideoFrameCallback) return;
    const watch = (_now: number, metadata: { mediaTime: number }) => {
      if (metadata.mediaTime >= 4.65) setPrepared(true);
      if (isOpen.current && !transitionStarted.current)
        videoFrame.current = element.requestVideoFrameCallback?.(watch) ?? null;
    };
    if (videoFrame.current !== null)
      element.cancelVideoFrameCallback?.(videoFrame.current);
    videoFrame.current = element.requestVideoFrameCallback(watch);
  }

  function enableSound() {
    if (!video.current) return;
    video.current.muted = false;
    setAudioBlocked(false);
    void video.current.play().catch(() => setAudioBlocked(true));
  }

  function retryPlayback() {
    if (!video.current) return;
    setPlaybackFailed(false);
    setPrepared(false);
    video.current.currentTime = 0;
    video.current.muted = true;
    void video.current.play().catch(showPlaybackFallback);
  }

  if (!visible) return null;
  return (
    <div
      ref={dialog}
      tabIndex={-1}
      className={`site-intro${prepared ? " is-prepared" : ""}${
        playbackFailed ? " has-playback-fallback" : ""
      }${transitioning ? " is-transitioning" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura Imports Tech"
    >
      <Image
        className="intro-final-frame"
        src={BRAND_ASSETS.introFinalFrame}
        alt=""
        fill
        sizes="100vw"
        priority
        unoptimized
      />
      <video
        ref={video}
        muted
        playsInline
        preload="auto"
        poster={BRAND_ASSETS.introPoster}
        onLoadedMetadata={monitorFrames}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= 4.65) setPrepared(true);
        }}
        onPlaying={() => setPlaybackFailed(false)}
        onEnded={() => beginTransition(false)}
        onError={showPlaybackFallback}
      >
        <source src={BRAND_ASSETS.introWebm} type="video/webm" />
        <source src={BRAND_ASSETS.introMp4} type="video/mp4" />
      </video>
      <div
        className="intro-transition-rings"
        ref={transitionRings}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
      </div>
      <div className="intro-flight-logo" ref={flightLogo} aria-hidden="true">
        <Image
          src={BRAND_ASSETS.logo}
          alt=""
          fill
          sizes="344px"
          priority
          unoptimized
        />
      </div>
      <div className="intro-actions">
        {playbackFailed && (
          <button type="button" onClick={retryPlayback}>
            Tentar reproduzir
          </button>
        )}
        {audioBlocked && (
          <button type="button" onClick={enableSound}>
            Ativar som
          </button>
        )}
        <button ref={skip} type="button" onClick={() => beginTransition(true)}>
          {playbackFailed ? "Continuar" : "Pular intro"}
        </button>
      </div>
      <span className="sr-only" role="status">
        {playbackFailed
          ? "O vídeo não iniciou. O poster permanece visível."
          : transitioning
            ? "Abrindo a página inicial"
            : "Introdução em reprodução"}
      </span>
    </div>
  );
}

function pxRect(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}
