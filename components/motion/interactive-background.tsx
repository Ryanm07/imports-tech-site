export function InteractiveBackground() {
  return (
    <div className="interactive-background" aria-hidden="true">
      <span className="interactive-background-glow" />
      <span className="interactive-background-grid" />
      <span className="interactive-background-noise" />
      <span className="global-signal-thread" />
    </div>
  );
}
