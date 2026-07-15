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
  const [assetsReady, setAssetsReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [soundRequested, setSoundRequested] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const flightLogo = useRef<HTMLDivElement>(null);
  const transitionRings = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const transitionStarted = useRef(false);
  const finishTimer = useRef<number | null>(null);

  const openIntro = useCallback((sound: boolean) => {
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
    document.body.classList.remove(
      "intro-active",
      "intro-transitioning",
      "intro-logo-flight",
    );
    setVisible(false);
    setTransitioning(false);
    const restore = previousFocus.current;
    window.setTimeout(() => {
      if (restore && restore !== document.body) restore.focus();
    }, 0);
  }, []);

  const beginTransition = useCallback(
    (reduced = false) => {
      if (transitionStarted.current || !flightLogo.current) return;
      transitionStarted.current = true;
      setPrepared(true);
      setTransitioning(true);
      video.current?.pause();
      document.body.classList.add("intro-transitioning", "intro-logo-flight");

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

      Object.assign(flightLogo.current.style, pxRect(geometry.logo));
      flightLogo.current.animate(
        [
          {
            ...pxRect(geometry.logo),
            borderRadius: "2px",
            opacity: 1,
            filter: "drop-shadow(0 18px 26px rgba(0,0,0,.36))",
          },
          {
            left: `${targetRect?.left ?? 24}px`,
            top: `${targetRect?.top ?? 16}px`,
            width: `${targetRect?.width ?? 44}px`,
            height: `${targetRect?.height ?? 44}px`,
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
      );

      if (transitionRings.current) {
        Object.assign(transitionRings.current.style, pxRect(geometry.rings));
        transitionRings.current.animate(
          [
            {
              ...pxRect(geometry.rings),
              opacity: 0.96,
              transform: "rotate(0deg)",
            },
            {
              left: `${orbitRect?.left ?? geometry.rings.left}px`,
              top: `${orbitRect?.top ?? geometry.rings.top}px`,
              width: `${orbitRect?.width ?? geometry.rings.width}px`,
              height: `${orbitRect?.height ?? geometry.rings.height}px`,
              opacity: orbitRect ? 0.26 : 0,
              transform: "rotate(24deg)",
            },
          ],
          {
            duration: reduced ? 320 : 820,
            delay: reduced ? 0 : 80,
            easing: "cubic-bezier(.2,.75,.2,1)",
            fill: "forwards",
          },
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
          window.setTimeout(finish, 80);
        },
        duration + (reduced ? 80 : 220),
      );
    },
    [finish],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all(
      [
        BRAND_ASSETS.introMp4,
        BRAND_ASSETS.introWebm,
        BRAND_ASSETS.introPoster,
        BRAND_ASSETS.introFinalFrame,
      ].map((asset) => fetch(asset, { method: "HEAD" })),
    )
      .then((responses) => {
        if (cancelled || !responses.every((response) => response.ok)) return;
        setAssetsReady(true);
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
          seenThisSession =
            sessionStorage.getItem(INTRO_SESSION_KEY) === "seen";
        } catch {
          seenThisSession = false;
        }
        const show = shouldShowIntro({
          enabled,
          replay,
          seenThisSession,
          reducedMotion,
          saveData: Boolean(connection?.saveData),
          effectiveType: connection?.effectiveType,
          hasPlayableAsset: true,
        });
        if (show && (window.location.pathname === "/" || replay)) {
          openIntro(params.get("sound") === "1");
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, openIntro]);

  useEffect(() => {
    const replay = (event: Event) => {
      if (!enabled || !assetsReady) return;
      const detail = (event as ReplayEvent).detail;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reducedMotion) return;
      openIntro(Boolean(detail?.sound));
    };
    window.addEventListener("imports-tech:intro-replay", replay);
    return () =>
      window.removeEventListener("imports-tech:intro-replay", replay);
  }, [assetsReady, enabled, openIntro]);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("intro-active");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skip.current?.focus();
    const safety = window.setTimeout(() => beginTransition(true), 8_000);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") beginTransition(true);
    };
    window.addEventListener("keydown", escape);

    const element = video.current;
    if (element) {
      element.currentTime = 0;
      element.muted = !soundRequested;
      void element.play().catch(() => {
        if (soundRequested) {
          element.muted = true;
          setAudioBlocked(true);
          void element.play().catch(showPlaybackFallback);
        } else {
          showPlaybackFallback();
        }
      });
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(safety);
      window.removeEventListener("keydown", escape);
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
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
      if (!transitionStarted.current)
        element.requestVideoFrameCallback?.(watch);
    };
    element.requestVideoFrameCallback(watch);
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
