"use client";

import { useEffect, useState } from "react";
import { StudioIcon } from "./studio-icons";

// Mobile browsers hide their native scrollbar. This separate touch target lets
// visitors scroll a short viewport without sending gestures to the 3D camera.
export function StudioPageScrollbar() {
  const [position, setPosition] = useState({ maximum: 0, percent: 0 });

  useEffect(() => {
    const sync = () => {
      const maximum = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const percent = maximum
        ? Math.min(100, Math.max(0, (window.scrollY / maximum) * 100))
        : 0;
      setPosition((previous) =>
        previous.maximum === maximum && previous.percent === percent
          ? previous
          : { maximum, percent },
      );
    };
    const observer = new ResizeObserver(sync);
    observer.observe(document.body);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, []);

  if (position.maximum <= 1) return null;

  function scrollToPercent(percent: number) {
    setPosition((previous) => ({ ...previous, percent }));
    window.scrollTo({
      top: (position.maximum * percent) / 100,
      behavior: "instant",
    });
  }

  return (
    <div
      className="studio-page-scrollbar"
      role="group"
      aria-label="Rolagem da página"
    >
      <button
        className="studio-scroll-up"
        aria-label="Rolar página para cima"
        disabled={position.percent <= 0}
        onClick={() => scrollToPercent(Math.max(0, position.percent - 50))}
      >
        <StudioIcon name="arrow" width="18" height="18" />
      </button>
      <input
        type="range"
        min="0"
        max="100"
        step="any"
        value={position.percent}
        aria-label="Rolar o estúdio"
        aria-orientation="vertical"
        aria-controls="conteudo"
        aria-valuetext={`${Math.round(position.percent)}% da página`}
        onChange={(event) => scrollToPercent(Number(event.currentTarget.value))}
      />
      <button
        className="studio-scroll-down"
        aria-label="Rolar página para baixo"
        disabled={position.percent >= 100}
        onClick={() => scrollToPercent(Math.min(100, position.percent + 50))}
      >
        <StudioIcon name="arrow" width="18" height="18" />
      </button>
    </div>
  );
}
