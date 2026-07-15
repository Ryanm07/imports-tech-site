"use client";

export function IntroReplayButtons() {
  function replay(sound: boolean) {
    window.dispatchEvent(
      new CustomEvent("imports-tech:intro-replay", { detail: { sound } }),
    );
  }
  return (
    <div className="hero-buttons">
      <button className="button secondary" onClick={() => replay(false)}>
        Rever introdução
      </button>
      <button
        className="inline-link replay-with-sound"
        onClick={() => replay(true)}
      >
        Rever intro com som
      </button>
    </div>
  );
}
