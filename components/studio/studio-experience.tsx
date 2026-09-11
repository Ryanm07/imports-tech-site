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
}: {
  item: StudioItem;
  onClose: () => void;
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
        <p className="studio-detail-note">
          Este objeto usa uma forma provisória. O modelo detalhado e seus
          efeitos entram na próxima etapa.
        </p>
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
  const [panel, setPanel] = useState<"objects" | "help" | "menu" | null>(null);
  const movement = useRef<MovementInput>({ forward: 0, right: 0 });
  const viewport = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelTrigger = useRef<HTMLElement | null>(null);
  const activeItem = STUDIO_ITEMS.find(
    (item) => item.id === state.selectedItem,
  );
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
    if (!mounted || ready || failed) return;
    const timer = window.setTimeout(onFailure, 20_000);
    return () => window.clearTimeout(timer);
  }, [mounted, ready, failed, onFailure, sceneKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || activeItem) return;
      if (panel) {
        setPanel(null);
        panelTrigger.current?.focus();
      } else dispatch({ type: "escape" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, activeItem]);

  useEffect(() => {
    if (panel)
      panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
  }, [panel]);

  const select = useCallback((id: string) => {
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
    >
      <a className="studio-skip" href="#studio-tools">
        Pular para os controles
      </a>
      <div className="studio-viewport" ref={viewport}>
        {mounted && !failed && (
          <SceneBoundary key={sceneKey} onFailure={onFailure}>
            <Suspense fallback={null}>
              <StudioCanvas
                theme={state.theme}
                mode={state.mode}
                paused={Boolean(activeItem || panel)}
                resetKey={resetKey}
                reducedMotion={reducedMotion}
                movement={movement}
                onReady={onReady}
                onFailure={onFailure}
                onSelect={select}
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

      {!ready && !failed && (
        <div className="studio-loading" role="status">
          <div className="studio-loading-mark" />
          <p>Preparando o estúdio…</p>
        </div>
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
        aria-hidden={state.mode === "walk" || Boolean(panel)}
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
        <div className="studio-walk-status">
          <i />
          <span>Exploração livre</span>
          <kbd>Esc</kbd>
        </div>
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
                : "Navegação"
          }
        >
          <div className="studio-panel-heading">
            <h2>
              {panel === "objects"
                ? "Pela bancada"
                : panel === "help"
                  ? "Fique à vontade"
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
                Os lugares já estão definidos. Os modelos detalhados chegam na
                próxima etapa.
              </p>
              <div className="studio-object-list">
                {STUDIO_ITEMS.map((item) => (
                  <button key={item.id} onClick={() => select(item.id)}>
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
          {panel === "help" && (
            <div className="studio-help">
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
                  Clique em um equipamento ou escolha pela lista. Escape fecha o
                  conteúdo ou sai do modo livre. A iluminação pode ser ajustada
                  a qualquer momento.
                </p>
              </section>
            </div>
          )}
        </aside>
      )}

      {state.mode === "walk" && !panel && !activeItem && (
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
            onClick={() => setResetKey((value) => value + 1)}
            disabled={!ready || failed}
            aria-label="Restaurar câmera"
            title="Restaurar câmera"
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
      </div>
      {activeItem && (
        <ObjectDetail
          key={activeItem.id}
          item={activeItem}
          onClose={closeDetail}
        />
      )}
      <StudioPageScrollbar />
    </main>
  );
}
