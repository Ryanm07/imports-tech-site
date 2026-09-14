"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialStudioState,
  readStudioTheme,
  studioReducer,
} from "@/lib/studio-navigation";
import { STUDIO_ITEMS, type StudioItem } from "@/lib/studio-content";
import { StudioIcon } from "./studio-icons";
import { StudioPageScrollbar } from "./studio-page-scrollbar";
import type { MovementInput } from "./studio-canvas";
import { useStudioQuality } from "./use-studio-quality";
import { QualityControl } from "./quality-control";
import type { StudioObjectActions } from "./object-interaction-context";

const StudioCanvas = lazy(() => import("./studio-canvas"));
const THEME_KEY = "imports-tech:studio-theme:v1";

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ObjectDetail({
  item,
  onClose,
  onPick,
  lightOn,
  onToggleLight,
}: {
  item: StudioItem;
  onClose: () => void;
  onPick?: () => void;
  lightOn?: boolean;
  onToggleLight?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="studio-detail"
      aria-labelledby="studio-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="studio-detail-inner">
        <div className="studio-detail-heading">
          <span>{item.category}</span>
          <button
            className="studio-icon-button"
            onClick={onClose}
            aria-label="Fechar objeto"
          >
            <StudioIcon name="close" />
          </button>
        </div>
        <div className="studio-detail-symbol" aria-hidden="true">
          <StudioIcon
            name={item.id.startsWith("milestone") ? "orbit" : "keyboard"}
            width="46"
            height="46"
          />
        </div>
        <h2 id="studio-detail-title">{item.title}</h2>
        <p className="studio-detail-lead">{item.description}</p>
        {item.details.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
        {item.videoId && (
          <a
            className="studio-action"
            href={`https://www.youtube.com/watch?v=${item.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            <StudioIcon name="play" /> Assistir ao episódio{" "}
            <StudioIcon name="arrow" />
          </a>
        )}
        {item.href && (
          <Link className="studio-action" href={item.href}>
            Conhecer a história <StudioIcon name="arrow" />
          </Link>
        )}
        {onToggleLight && (
          <button
            className="studio-action"
            onClick={onToggleLight}
            aria-pressed={lightOn}
          >
            <StudioIcon name="sun" />{" "}
            {lightOn ? "Apagar ring bar" : "Acender ring bar"}
          </button>
        )}
        {onPick && (
          <button className="studio-action" onClick={onPick}>
            Pegar objeto <StudioIcon name="person" />
          </button>
        )}
      </div>
    </dialog>
  );
}

export function StudioExperience({
  commercialEmail,
}: {
  commercialEmail: string | null;
}) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [earbudsOpen, setEarbudsOpen] = useState(false);
  const [laptopOpen, setLaptopOpen] = useState(false);
  const [recordingLightOn, setRecordingLightOn] = useState(false);
  const focusLidStory = useRef(false);
  const lidStoryClose = useRef<HTMLButtonElement>(null);
  const {
    entry,
    quality,
    qualityPreference,
    setQualityPreference,
    ultraEligible,
    ultraCandidate,
    onDegrade,
    onUltraAssessed,
  } = useStudioQuality(reducedMotion);
  const [activate3D, setActivate3D] = useState(false);
  const sceneAllowed = entry === "3d" || activate3D;
  const objectActions = useRef<StudioObjectActions | null>(null);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [interactionReady, setInteractionReady] = useState(false);
  const [interactionFailed, setInteractionFailed] = useState(false);
  const onInteractionFailure = useCallback(
    () => setInteractionFailed(true),
    [],
  );
  const [panel, setPanel] = useState<
    "objects" | "help" | "menu" | "quality" | null
  >(null);
  const movement = useRef<MovementInput>({ forward: 0, right: 0 });
  const viewport = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelTrigger = useRef<HTMLElement | null>(null);
  const activeItem = STUDIO_ITEMS.find(
    (item) => item.id === state.selectedItem,
  );
  const budsItem = STUDIO_ITEMS.find((item) => item.id === "earbuds")!;
  const laptopItem = STUDIO_ITEMS.find((item) => item.id === "laptop")!;
  const showBudsStory = earbudsOpen && !panel && !activeItem;
  const showLaptopStory = laptopOpen && !panel && !activeItem;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      dispatch({
        type: "theme",
        theme: readStudioTheme(localStorage.getItem(THEME_KEY)),
      });
    } catch {
      /* Private browsing can disable storage. */
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(THEME_KEY, state.presentationTheme);
    } catch {
      /* Theme still works without persistence. */
    }
  }, [state.presentationTheme, mounted]);

  useEffect(() => {
    if (!mounted || !sceneAllowed || ready || failed) return;
    const timer = window.setTimeout(onFailure, 20_000);
    return () => window.clearTimeout(timer);
  }, [mounted, sceneAllowed, ready, failed, onFailure, sceneKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || activeItem) return;
      if (heldId) {
        objectActions.current?.drop();
        return;
      }
      if (panel) {
        setPanel(null);
        panelTrigger.current?.focus();
      } else if (earbudsOpen || laptopOpen) {
        setEarbudsOpen(false);
        setLaptopOpen(false);
        (
          viewport.current?.querySelector("canvas") ?? panelTrigger.current
        )?.focus({ preventScroll: true });
      } else dispatch({ type: "escape" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, activeItem, earbudsOpen, laptopOpen, heldId]);

  useEffect(() => {
    if (focusLidStory.current && (showBudsStory || showLaptopStory)) {
      focusLidStory.current = false;
      lidStoryClose.current?.focus({ preventScroll: true });
    }
  }, [showBudsStory, showLaptopStory]);

  useEffect(() => {
    if (panel)
      panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
  }, [panel]);

  const select = useCallback((id: string) => {
    if (id === "earbuds") {
      setEarbudsOpen((open) => !open);
      setLaptopOpen(false);
      setPanel(null);
      return;
    }
    if (id === "laptop") {
      setLaptopOpen((open) => !open);
      setEarbudsOpen(false);
      setPanel(null);
      return;
    }
    if (id === "recording-rig") setRecordingLightOn((on) => !on);
    if (STUDIO_ITEMS.some((item) => item.id === id))
      dispatch({ type: "select", id });
  }, []);
  const closeDetail = useCallback(
    () => dispatch({ type: "select", id: null }),
    [],
  );

  function togglePanel(next: typeof panel, trigger: HTMLElement) {
    panelTrigger.current = trigger;
    setPanel((current) => (current === next ? null : next));
  }
  function pickObject(id: string) {
    if (!objectActions.current?.pick(id)) return;
    setPanel(null);
    setEarbudsOpen(false);
    setLaptopOpen(false);
    dispatch({ type: "select", id: null });
    window.requestAnimationFrame(() =>
      viewport.current?.querySelector("canvas")?.focus({ preventScroll: true }),
    );
  }
  const onHeldChange = useCallback((id: string | null) => {
    setHeldId(id);
    if (id) {
      setPanel(null);
      setEarbudsOpen(false);
      setLaptopOpen(false);
      dispatch({ type: "select", id: null });
    }
  }, []);
  function restoreStudio() {
    objectActions.current?.restore();
    setEarbudsOpen(false);
    setLaptopOpen(false);
    setResetKey((value) => value + 1);
  }
  function changeMode() {
    setPanel(null);
    dispatch({
      type: "mode",
      mode: state.mode === "walk" ? "overview" : "walk",
    });
    window.requestAnimationFrame(() =>
      viewport.current?.querySelector("canvas")?.focus({ preventScroll: true }),
    );
  }
  function move(forward: number, right: number) {
    movement.current = { forward, right };
    window.dispatchEvent(new Event("imports-tech:studio-move"));
  }
  function retry() {
    setReady(false);
    setFailed(false);
    setSceneKey((value) => value + 1);
  }

  return (
    <main
      id="conteudo"
      className="studio-experience"
      data-studio-theme={state.theme}
      data-studio-mode={state.mode}
      data-scene-ready={ready && !failed}
      data-studio-quality={quality}
      data-quality-preference={qualityPreference}
      data-held-object={heldId || ""}
      data-interaction-ready={interactionReady}
      data-ultra-eligible={ultraEligible}
      data-ultra-assessing={ultraCandidate}
    >
      <a className="studio-skip" href="#studio-tools">
        Pular para os controles
      </a>
      <div className="studio-viewport" ref={viewport}>
        {mounted && sceneAllowed && !failed && (
          <SceneBoundary key={sceneKey} onFailure={onFailure}>
            <Suspense fallback={null}>
              <StudioCanvas
                theme={state.theme}
                mode={state.mode}
                paused={Boolean(activeItem || panel)}
                resetKey={resetKey}
                reducedMotion={reducedMotion}
                earbudsOpen={earbudsOpen}
                laptopOpen={laptopOpen}
                recordingLightOn={recordingLightOn}
                movement={movement}
                onReady={onReady}
                onFailure={onFailure}
                onSelect={select}
                actionsRef={objectActions}
                onHeldChange={onHeldChange}
                onInteractionReady={setInteractionReady}
                onInteractionFailure={onInteractionFailure}
                quality={quality}
                onDegrade={onDegrade}
                ultraCandidate={ultraCandidate}
                onUltraAssessed={onUltraAssessed}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="studio-vignette" aria-hidden="true" />

      <header className="studio-header">
        <Link
          href="/"
          className="studio-brand"
          aria-label="Imports Tech — estúdio"
        >
          <Image
            src="/brand/imports-tech-logo.jpg"
            alt=""
            width={42}
            height={42}
            priority
            unoptimized
          />
          <span>
            imports<span className="studio-brand-weight">tech</span>
            <small>O estúdio do Ryan</small>
          </span>
        </Link>
        <div className="studio-header-actions">
          <button
            className="studio-quality-button"
            onClick={(event) => togglePanel("quality", event.currentTarget)}
            aria-expanded={panel === "quality"}
            aria-controls="studio-panel"
            aria-label="Escolher qualidade visual"
          >
            <StudioIcon name="orbit" /> <span>Qualidade</span>
          </button>
          <span className="studio-stage">
            <i /> Base do estúdio
          </span>
          <button
            className="studio-icon-button"
            onClick={(event) => togglePanel("menu", event.currentTarget)}
            aria-expanded={panel === "menu"}
            aria-controls="studio-panel"
            aria-label={panel === "menu" ? "Fechar menu" : "Abrir menu"}
          >
            <StudioIcon name="menu" />
          </button>
        </div>
      </header>

      {!ready && !failed && (entry !== "static" || activate3D) && (
        <div className="studio-loading" role="status">
          <div className="studio-loading-mark" />
          <p>Preparando o estúdio…</p>
        </div>
      )}
      {entry === "static" &&
        !activate3D &&
        !panel &&
        !activeItem &&
        !showBudsStory &&
        !showLaptopStory && (
          <section
            className="studio-static-entry"
            aria-label="Explorar com economia"
          >
            <StudioIcon name="orbit" width="36" height="36" />
            <h2>Explore no seu ritmo.</h2>
            <p>
              A versão leve começa pelas histórias. O estúdio 3D fica disponível
              quando você quiser entrar.
            </p>
            <button
              className="studio-action"
              onClick={(event) => togglePanel("objects", event.currentTarget)}
            >
              Conhecer os objetos <StudioIcon name="grid" />
            </button>
            <button
              className="studio-action studio-start-3d"
              onClick={() => setActivate3D(true)}
            >
              Entrar no estúdio 3D <StudioIcon name="person" />
            </button>
          </section>
        )}
      {failed && (
        <div className="studio-error" role="status">
          <StudioIcon name="orbit" width="36" height="36" />
          <h2>O 3D não abriu desta vez.</h2>
          <p>Você pode tentar novamente ou conhecer os objetos pela lista.</p>
          <button className="studio-action" onClick={retry}>
            Tentar novamente <StudioIcon name="reset" />
          </button>
        </div>
      )}

      <div
        className="studio-introduction"
        aria-hidden={
          state.mode === "walk" ||
          Boolean(panel) ||
          showBudsStory ||
          showLaptopStory
        }
      >
        <span className="studio-location">
          Imports Tech / Espaço de descobertas
        </span>
        <h1>
          Entre. Fique <br />à vontade.
        </h1>
        <p>
          Escolha um objeto. <br />
          Tem uma história por aqui.
        </p>
      </div>

      {state.mode === "walk" && (
        <div className="studio-walk-status" aria-live="polite">
          <i />
          <span>
            {heldId
              ? `Segurando: ${STUDIO_ITEMS.find((item) => item.id === heldId)?.title || "objeto"}`
              : "Exploração livre"}
          </span>
          <kbd>Esc</kbd>
        </div>
      )}

      {showBudsStory && (
        <aside
          className="studio-panel studio-buds-story"
          aria-labelledby="buds-story-title"
        >
          <div className="studio-panel-heading">
            <span className="studio-buds-category">Na bancada · Áudio</span>
            <button
              className="studio-icon-button"
              aria-label="Fechar informações do Buds e tampa"
              ref={lidStoryClose}
              onClick={() => {
                setEarbudsOpen(false);
                (
                  viewport.current?.querySelector("canvas") ??
                  panelTrigger.current
                )?.focus({ preventScroll: true });
              }}
            >
              <StudioIcon name="close" />
            </button>
          </div>
          <h2 id="buds-story-title">Buds 4 Pro</h2>
          <p className="studio-buds-lead">Um pedaço do meu dia a dia.</p>
          <section>
            <h3>No meu dia a dia</h3>
            <p>
              O Buds 4 Pro é o fone que uso no dia a dia. Aqui no estúdio, ele
              também tem seu lugar na bancada.
            </p>
          </section>
          <section>
            <h3>No Imports Tech</h3>
            <p>
              Além de fazer parte da minha rotina, ele tem um episódio no canal.
              É lá que você pode acompanhar o conteúdo sobre esse fone.
            </p>
            <a
              className="studio-action"
              href={`https://www.youtube.com/watch?v=${budsItem.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              <StudioIcon name="play" /> Assistir ao episódio{" "}
              <StudioIcon name="arrow" />
            </a>
          </section>
          {state.mode === "walk" && interactionReady && (
            <button
              className="studio-action"
              onClick={() => pickObject("earbuds")}
            >
              Pegar Buds <StudioIcon name="person" />
            </button>
          )}
          <p className="studio-buds-hint">
            Clique novamente no estojo para fechar a tampa e voltar à bancada.
          </p>
        </aside>
      )}
      {showLaptopStory && (
        <aside
          className="studio-panel studio-buds-story"
          aria-labelledby="laptop-story-title"
        >
          <div className="studio-panel-heading">
            <span className="studio-buds-category">{laptopItem.category}</span>
            <button
              className="studio-icon-button"
              aria-label="Fechar informações e tampa do notebook"
              ref={lidStoryClose}
              onClick={() => {
                setLaptopOpen(false);
                (
                  viewport.current?.querySelector("canvas") ??
                  panelTrigger.current
                )?.focus({ preventScroll: true });
              }}
            >
              <StudioIcon name="close" />
            </button>
          </div>
          <h2 id="laptop-story-title">{laptopItem.title}</h2>
          <p className="studio-buds-lead">{laptopItem.description}</p>
          <section>
            <h3>No Imports Tech</h3>
            {laptopItem.details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
            {laptopItem.videoId && (
              <a
                className="studio-action"
                href={`https://www.youtube.com/watch?v=${laptopItem.videoId}`}
                target="_blank"
                rel="noreferrer"
              >
                <StudioIcon name="play" /> Assistir ao episódio{" "}
                <StudioIcon name="arrow" />
              </a>
            )}
          </section>
          {state.mode === "walk" && interactionReady && (
            <button
              className="studio-action"
              onClick={() => pickObject("laptop")}
            >
              Pegar notebook <StudioIcon name="person" />
            </button>
          )}
          <p className="studio-buds-hint">
            Clique novamente no notebook para fechar a tampa e voltar à bancada.
          </p>
        </aside>
      )}
      {panel && (
        <aside
          ref={panelRef}
          id="studio-panel"
          className="studio-panel"
          aria-label={
            panel === "objects"
              ? "Objetos do estúdio"
              : panel === "help"
                ? "Como explorar"
                : panel === "quality"
                  ? "Qualidade visual"
                  : "Navegação"
          }
        >
          <div className="studio-panel-heading">
            <h2>
              {panel === "objects"
                ? "Pela bancada"
                : panel === "help"
                  ? "Fique à vontade"
                  : panel === "quality"
                    ? "Do seu jeito"
                    : "Explore também"}
            </h2>
            <button
              className="studio-icon-button"
              aria-label="Fechar painel"
              onClick={() => {
                setPanel(null);
                panelTrigger.current?.focus();
              }}
            >
              <StudioIcon name="close" />
            </button>
          </div>
          {panel === "objects" && (
            <>
              <p className="studio-panel-intro">
                Escolha um equipamento para conhecer sua história. No Buds 4 Pro
                e no Acer Nitro 5, clique para abrir ou fechar a tampa. No kit
                de gravação, clique para acender ou apagar a ring bar.
              </p>
              <div className="studio-object-list">
                {STUDIO_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      focusLidStory.current =
                        (item.id === "laptop" && !laptopOpen) ||
                        (item.id === "earbuds" && !earbudsOpen);
                      select(item.id);
                    }}
                    aria-label={
                      item.id === "earbuds"
                        ? `${earbudsOpen ? "Fechar" : "Abrir"} tampa do Buds 4 Pro`
                        : item.id === "laptop"
                          ? `${laptopOpen ? "Fechar" : "Abrir"} tampa do Acer Nitro 5`
                          : undefined
                    }
                    aria-pressed={
                      item.id === "earbuds"
                        ? earbudsOpen
                        : item.id === "laptop"
                          ? laptopOpen
                          : undefined
                    }
                  >
                    <span>
                      <small>{item.category}</small>
                      {item.title}
                    </span>
                    <StudioIcon name="arrow" />
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "menu" && (
            <nav className="studio-menu" aria-label="Navegação principal">
              <Link href="/sobre">
                Minha história <StudioIcon name="arrow" />
              </Link>
              <Link href="/comunidade">
                Comunidade <StudioIcon name="arrow" />
              </Link>
              <Link href="/metricas">
                Métricas do canal <StudioIcon name="arrow" />
              </Link>
              <Link href="/contato">
                Contato <StudioIcon name="arrow" />
              </Link>
              <div className="studio-menu-footer">
                {commercialEmail && (
                  <a href={`mailto:${commercialEmail}`}>{commercialEmail}</a>
                )}
                <Link href="/privacidade">Privacidade</Link>
              </div>
            </nav>
          )}
          {panel === "quality" && (
            <QualityControl
              quality={quality}
              preference={qualityPreference}
              onPreferenceChange={setQualityPreference}
              evaluating={ultraCandidate}
            />
          )}
          {panel === "help" && (
            <div className="studio-help">
              <QualityControl
                quality={quality}
                preference={qualityPreference}
                onPreferenceChange={setQualityPreference}
                evaluating={ultraCandidate}
              />
              <section>
                <StudioIcon name="orbit" />
                <h3>Olhe ao redor</h3>
                <p>
                  Na apresentação, arraste para girar a câmera e use a roda do
                  mouse para aproximar. No celular, use dois dedos para o zoom.
                </p>
              </section>
              <section>
                <StudioIcon name="person" />
                <h3>Entre no estúdio</h3>
                <p>
                  Ative o modo livre para caminhar. Use W A S D ou as setas e
                  arraste para olhar. No celular, segure os controles de
                  direção.
                </p>
              </section>
              <section>
                <StudioIcon name="grid" />
                <h3>Descubra os objetos</h3>
                <p>
                  No modo livre, um clique mostra a história. Dois cliques
                  rápidos pegam o objeto; mais dois lançam na direção do olhar.
                  No celular, toque e use Pegar, Jogar ou Soltar. Esc solta o
                  objeto antes de sair. Restaurar estúdio traz tudo de volta.
                </p>
              </section>
            </div>
          )}
        </aside>
      )}

      {state.mode === "walk" &&
        !panel &&
        !activeItem &&
        !showBudsStory &&
        !showLaptopStory && (
          <div
            className="studio-object-actions"
            aria-label="Interação com objetos"
          >
            {heldId ? (
              <>
                <button
                  className="studio-action"
                  onClick={() => objectActions.current?.throw()}
                >
                  Jogar <StudioIcon name="arrow" />
                </button>
                <button
                  className="studio-action"
                  onClick={() => objectActions.current?.drop()}
                >
                  Soltar
                </button>
              </>
            ) : (
              <p>
                {interactionReady
                  ? "Dois cliques para pegar · Toque para ver opções"
                  : interactionFailed
                    ? "As interações não carregaram. Você ainda pode explorar os objetos."
                    : "Preparando interações…"}
              </p>
            )}
          </div>
        )}
      {state.mode === "walk" &&
        !panel &&
        !activeItem &&
        !showBudsStory &&
        !showLaptopStory && (
          <div className="studio-touch-pad" aria-label="Controles de movimento">
            {[
              {
                label: "Mover para frente",
                forward: 1,
                right: 0,
                position: "up",
              },
              {
                label: "Mover para esquerda",
                forward: 0,
                right: -1,
                position: "left",
              },
              {
                label: "Mover para trás",
                forward: -1,
                right: 0,
                position: "down",
              },
              {
                label: "Mover para direita",
                forward: 0,
                right: 1,
                position: "right",
              },
            ].map((direction) => (
              <button
                key={direction.position}
                className={`studio-direction studio-direction-${direction.position}`}
                aria-label={direction.label}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  move(direction.forward, direction.right);
                }}
                onPointerUp={() => move(0, 0)}
                onPointerCancel={() => move(0, 0)}
                onLostPointerCapture={() => move(0, 0)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter")
                    move(direction.forward, direction.right);
                }}
                onKeyUp={() => move(0, 0)}
                onBlur={() => move(0, 0)}
              >
                <StudioIcon name="arrow" />
              </button>
            ))}
          </div>
        )}

      <footer className="studio-bottom">
        <div className="studio-footer-note">
          <span className="studio-compass">N</span>
          <span>
            {state.mode === "walk"
              ? "Arraste para olhar · W A S D para andar"
              : "Arraste para olhar ao redor"}
          </span>
        </div>
        <div
          id="studio-tools"
          className="studio-toolbar"
          role="group"
          aria-label="Controles do estúdio"
        >
          <button
            className={panel === "objects" ? "is-active" : ""}
            onClick={(event) => togglePanel("objects", event.currentTarget)}
            aria-label="Explorar objetos"
            aria-expanded={panel === "objects"}
            aria-controls="studio-panel"
          >
            <StudioIcon name="grid" />
            <span>Objetos</span>
          </button>
          <span className="studio-tool-divider" />
          <button
            className={
              state.mode === "walk"
                ? "is-active studio-mode-button"
                : "studio-mode-button"
            }
            onClick={changeMode}
            disabled={!ready || failed}
            aria-pressed={state.mode === "walk"}
            aria-label={
              state.mode === "walk"
                ? "Voltar à apresentação"
                : "Andar pelo estúdio"
            }
          >
            <StudioIcon name={state.mode === "walk" ? "orbit" : "person"} />
            <span>
              {state.mode === "walk" ? "Visão geral" : "Andar pelo estúdio"}
            </span>
          </button>
          <span className="studio-tool-divider" />
          <button
            onClick={() =>
              dispatch({
                type: "theme",
                theme: state.theme === "dark" ? "light" : "dark",
              })
            }
            aria-label={
              state.theme === "dark"
                ? "Ativar modo claro"
                : "Ativar modo escuro"
            }
            title={
              state.theme === "dark" ? "Acender as luzes" : "Apagar as luzes"
            }
          >
            <StudioIcon name={state.theme === "dark" ? "sun" : "moon"} />
          </button>
          <button
            onClick={restoreStudio}
            disabled={!ready || failed}
            aria-label="Restaurar estúdio"
            title="Restaurar estúdio e câmera"
          >
            <StudioIcon name="reset" />
          </button>
        </div>
        <button
          className="studio-icon-button studio-help-button"
          onClick={(event) => togglePanel("help", event.currentTarget)}
          aria-label="Como explorar o estúdio"
          aria-expanded={panel === "help"}
          aria-controls="studio-panel"
        >
          <StudioIcon name="help" />
        </button>
      </footer>
      <div className="studio-announcement" aria-live="polite">
        {state.mode === "walk"
          ? "Modo livre. Use W A S D para andar e arraste para olhar."
          : "Modo apresentação."}{" "}
        Iluminação {state.theme === "light" ? "clara" : "escura"}.
        {earbudsOpen && " Tampa do Buds 4 Pro aberta."}
        {laptopOpen && " Tampa do Acer Nitro 5 aberta."}
        {recordingLightOn && " Ring bar acesa."}
      </div>
      {activeItem && (
        <ObjectDetail
          key={activeItem.id}
          item={activeItem}
          onClose={closeDetail}
          lightOn={recordingLightOn}
          onToggleLight={
            activeItem.id === "recording-rig"
              ? () => setRecordingLightOn((on) => !on)
              : undefined
          }
          onPick={
            state.mode === "walk" && interactionReady
              ? () => pickObject(activeItem.id)
              : undefined
          }
        />
      )}
      <StudioPageScrollbar />
    </main>
  );
}
