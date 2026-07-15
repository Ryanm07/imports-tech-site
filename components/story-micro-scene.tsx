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
    case "first-recording":
      return (
        <>
          <div className="record-phone">
            <i />
            <span>REC</span>
            <div className="record-keyboard">
              {Array.from({ length: 12 }, (_, index) => (
                <b key={index} />
              ))}
            </div>
          </div>
          <div className="record-timeline">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="record-audio">
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} />
            ))}
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
          <span className="rig-bar" />
          <span className="rig-mic" />
          <span className="rig-screen">PC</span>
          <strong className="equipment-risk">
            ≈ R$ 300 <small>primeiro risco</small>
          </strong>
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
          <b className="signal-line" />
          <em className="signal-pulse" />
        </div>
      );
    case "unexpected-discovery":
      return (
        <div className="discovery-box" aria-hidden="true">
          <i className="box-lid" />
          <div className="box-device" />
          <span className="route before" />
          <span className="route after" />
        </div>
      );
    case "pattern-discovery":
      return (
        <div className="pattern-field" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
          <span className="pattern-path" />
          <strong>≈ 50 mil</strong>
          <small>≈ 300 inscritos</small>
          <em>Eu acho que estou entendendo um padrão.</em>
        </div>
      );
    case "mechanical-switch":
      return (
        <div className="counter-machine" aria-hidden="true">
          <span className="counter-value before">999</span>
          <span className="counter-value after">1.000</span>
          <i className="counter-lever" />
          <span className="counter-wait">EM ESPERA</span>
          <b className="counter-circuit" />
          <small>4 JUN 2026</small>
          <em>monetização liberada</em>
        </div>
      );
    case "massive-number":
      return (
        <div className="impact-number" aria-hidden="true">
          <i />
          <i />
          <i />
          <strong>200.000</strong>
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
            <div className="processing-components">
              <b />
              <b />
              <b />
              <b />
            </div>
          </div>
          <div className="storage-drives">
            <div className="storage-drive">
              <i />
            </div>
            <div className="storage-drive">
              <i />
            </div>
          </div>
          <div className="processing-time">
            <i />
            <b />
            <span>dia</span>
            <span>noite</span>
          </div>
          <div className="processing-edit-line">
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
          <div className="production-inputs">
            {[
              "áudio",
              "roteiro",
              "cortes",
              "música",
              "efeitos",
              "thumbnail",
              "título",
              "descrição",
            ].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <span className="belt" />
          <div className="final-cut">10–15 min</div>
          <strong>1h de gravação</strong>
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
          <strong>100.000</strong>
          <small>FIM DE 2027</small>
          <b />
        </div>
      );
  }
}

function sceneLabel(preset: StoryVisualPreset) {
  const labels: Record<StoryVisualPreset, string> = {
    origin: "Eu começo como um pequeno sinal que ganha voz.",
    "identity-transform":
      "Eu reorganizo a identidade R Import até chegar a Imports Tech.",
    "first-recording":
      "Eu transformo uma gravação inicial em uma linha de edição.",
    "equipment-build": "Eu monto meu equipamento de gravação peça por peça.",
    "first-signal":
      "Eu vejo o gráfico crescer dos primeiros acessos até cerca de seis mil.",
    "unexpected-discovery":
      "Eu abro uma caixa e encontro um novo caminho narrativo.",
    "pattern-discovery": "Eu conecto os pontos e reconheço um padrão.",
    "mechanical-switch": "Eu vejo um contador mecânico mudar de 999 para mil.",
    "massive-number":
      "Eu vejo ondas de impacto ao redor de duzentas mil visualizações.",
    "heavy-processing": "Eu acumulo dados e esforço durante uma edição pesada.",
    "production-line":
      "Eu faço o material bruto atravessar uma linha e virar um vídeo conciso.",
    "time-balance":
      "Eu tento equilibrar canal, trabalho, faculdade, academia e descanso.",
    "future-target":
      "Eu sigo por uma linha aberta em direção à meta de cem mil inscritos.",
  };
  return labels[preset];
}
