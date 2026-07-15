import type { StoryMilestone, StoryVisualPreset } from "@/lib/story";
import { storyVisualTypeForSlug } from "@/lib/story";

export function StoryMicroScene({ item }: { item: StoryMilestone }) {
  const preset = item.visualType || storyVisualTypeForSlug(item.slug);

  return (
    <div
      className={`micro-scene scene-${preset}`}
      data-scene={preset}
      role="img"
      aria-label={item.visualDescription || sceneLabel(preset)}
    >
      <SceneContent preset={preset} />
      <div className="scene-metric" aria-hidden="true">
        <strong>{item.primaryMetric || item.number}</strong>
        <span>{item.secondaryMetric}</span>
      </div>
    </div>
  );
}

function SceneContent({ preset }: { preset: StoryVisualPreset }) {
  switch (preset) {
    case "origin":
      return (
        <>
          <span className="origin-dot" />
          <span className="origin-date">SET 2025</span>
          <div className="origin-audio">
            {Array.from({ length: 9 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        </>
      );
    case "identity-transform":
      return (
        <div className="identity-letters" aria-hidden="true">
          <span>R</span>
          <span>IMPORT</span>
          <i>→</i>
          <b>IMPORTS</b>
          <b>TECH</b>
        </div>
      );
    case "recording":
      return (
        <>
          <div className="record-phone">
            <i />
            <span>REC</span>
          </div>
          <div className="record-timeline">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="record-cursor" />
        </>
      );
    case "equipment-build":
      return (
        <div className="equipment-rig" aria-hidden="true">
          <div className="equipment-phone" />
          <i className="rig-leg a" />
          <i className="rig-leg b" />
          <span className="rig-light left" />
          <span className="rig-light right" />
          <span className="rig-mic" />
          <span className="rig-screen">PC</span>
        </div>
      );
    case "first-signal":
      return (
        <div className="signal-graph" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <span>100</span>
          <span>500</span>
          <span>2 mil</span>
          <strong>≈ 6 mil</strong>
          <small>aprox. na época</small>
        </div>
      );
    case "discovery":
      return (
        <div className="discovery-box" aria-hidden="true">
          <i className="box-lid" />
          <div className="box-device" />
          <span className="route before" />
          <span className="route after" />
        </div>
      );
    case "pattern":
      return (
        <div className="pattern-field" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
          <span className="pattern-path" />
          <strong>≈ 50 mil</strong>
          <small>≈ 300 inscritos</small>
        </div>
      );
    case "mechanical-switch":
      return (
        <div className="counter-machine" aria-hidden="true">
          <span className="counter-value before">999</span>
          <span className="counter-value after">1.000</span>
          <i className="counter-lever" />
          <b className="counter-circuit" />
          <small>4 JUN 2026</small>
        </div>
      );
    case "massive-number":
      return (
        <div className="impact-number" aria-hidden="true">
          <i />
          <i />
          <i />
          <strong>200 mil</strong>
          <span>
            Este canal <b>pode</b>
            <em>vai</em> dar certo.
          </span>
        </div>
      );
    case "heavy-processing":
      return (
        <div className="processing-stack" aria-hidden="true">
          <div className="processing-laptop">
            <i />
            <span />
          </div>
          <div className="disk-stack">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <strong>≈ 500 GB</strong>
          <span className="processing-clock">≈ 2 dias</span>
        </div>
      );
    case "production-line":
      return (
        <div className="production-belt" aria-hidden="true">
          <div className="raw-parts">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="belt" />
          <div className="final-cut">10–15 min</div>
          <strong>1h gravada</strong>
          <small>≈ 12h no total · ≈ 8h editando</small>
        </div>
      );
    case "time-balance":
      return (
        <div className="balance-orbit" aria-hidden="true">
          {["canal", "trabalho", "faculdade", "academia", "descanso"].map(
            (label) => (
              <span key={label}>{label}</span>
            ),
          )}
          <i />
        </div>
      );
    case "future-target":
      return (
        <div className="future-route" aria-hidden="true">
          <i className="future-line" />
          <span className="future-now">HOJE</span>
          <strong>100 mil</strong>
          <small>FIM DE 2027</small>
          <b />
          <div className="future-balance">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      );
  }
}

function sceneLabel(preset: StoryVisualPreset) {
  const labels: Record<StoryVisualPreset, string> = {
    origin: "Um pequeno sinal começa a ganhar voz.",
    "identity-transform":
      "A identidade R Import se reorganiza como Imports Tech.",
    recording: "Uma gravação inicial se transforma em uma linha de edição.",
    "equipment-build": "O equipamento de gravação é montado peça por peça.",
    "first-signal":
      "Um gráfico cresce dos primeiros acessos até cerca de seis mil.",
    discovery: "Uma caixa se abre e revela um novo caminho narrativo.",
    pattern: "Pontos se conectam e revelam um padrão.",
    "mechanical-switch": "Um contador mecânico muda de 999 para mil.",
    "massive-number":
      "Ondas de impacto surgem ao redor de duzentas mil visualizações.",
    "heavy-processing": "Discos se acumulam durante uma edição pesada.",
    "production-line":
      "Material bruto atravessa uma linha e vira um vídeo conciso.",
    "time-balance":
      "Canal, trabalho, faculdade, academia e descanso disputam equilíbrio.",
    "future-target":
      "Uma linha aberta segue em direção à meta de cem mil inscritos.",
  };
  return labels[preset];
}
