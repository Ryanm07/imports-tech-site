"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ContentType = "review" | "find" | "category" | "setting" | "timeline";
type ContentStatus =
  | "draft"
  | "review"
  | "reviewed"
  | "published"
  | "archived"
  | "removed";

type Entry = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  payload: string;
  status: ContentStatus;
  featured: boolean;
  updatedAt: string;
};

type YouTubeState = {
  state: Record<string, unknown> | null;
  runs: Record<string, unknown>[];
  configuration: Record<string, boolean>;
};

const statusOptions: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "review", label: "Aguardando revisão" },
  { value: "reviewed", label: "Revisado" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

export function AdminPanel({
  projectsEnabled = false,
}: {
  projectsEnabled?: boolean;
}) {
  const [tab, setTab] = useState<"content" | "youtube">("content");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [youtube, setYoutube] = useState<YouTubeState>({
    state: null,
    runs: [],
    configuration: {},
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [creating, setCreating] = useState<ContentType | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [content, metrics] = await Promise.all([
        getJson("/api/admin/content"),
        getJson("/api/admin/youtube"),
      ]);
      setEntries(content.entries || []);
      setYoutube(metrics);
    } catch (error) {
      setNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const statusMatches = status === "all" || entry.status === status;
        const text = `${entry.title} ${entry.slug} ${entry.type}`.toLowerCase();
        return statusMatches && text.includes(query.trim().toLowerCase());
      }),
    [entries, query, status],
  );

  async function changeStatus(entry: Entry, nextStatus: ContentStatus) {
    const result = await adminFetch("/api/admin/content", "PATCH", {
      id: entry.id,
      status: nextStatus,
    });
    setNotice(
      result.ok
        ? `Estado alterado para ${statusLabel(nextStatus)}.`
        : result.error,
    );
    if (result.ok) await load();
  }

  async function toggleFeatured(entry: Entry) {
    const result = await adminFetch("/api/admin/content", "PATCH", {
      id: entry.id,
      featured: !entry.featured,
    });
    setNotice(result.ok ? "Destaque atualizado." : result.error);
    if (result.ok) await load();
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const payload = parseJson(form.get("payload"));
    if (!payload.ok) return setNotice(payload.error);
    const result = await adminFetch("/api/admin/content", "PATCH", {
      id: editing.id,
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || ""),
      payload: payload.value,
      featured: form.get("featured") === "on",
    });
    setNotice(result.ok ? "Conteúdo validado e salvo." : result.error);
    if (result.ok) {
      setEditing(null);
      await load();
    }
  }

  async function createEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creating) return;
    const form = new FormData(event.currentTarget);
    const payload = parseJson(form.get("payload"));
    if (!payload.ok) return setNotice(payload.error);
    const result = await adminFetch("/api/admin/content", "POST", {
      type: creating,
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || ""),
      payload: payload.value,
    });
    setNotice(result.ok ? "Rascunho criado." : result.error);
    if (result.ok) {
      setCreating(null);
      await load();
    }
  }

  async function syncYouTube() {
    const result = await adminFetch("/api/admin/youtube", "POST", {});
    setNotice(result.ok ? "Sincronização concluída." : result.error);
    await load();
  }

  return (
    <section className="admin-panel" aria-busy={busy}>
      {!projectsEnabled && (
        <p className="admin-notice" role="note">
          Projetos estão desativados na experiência pública. Eu mantenho os
          reviews e garimpos preservados aqui para edição e uso futuro, mas eles
          não recebem links, destaques ou páginas públicas agora.
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      <div className="admin-tabs" role="tablist" aria-label="Áreas do painel">
        <button
          role="tab"
          aria-selected={tab === "content"}
          onClick={() => setTab("content")}
        >
          Conteúdo editorial
        </button>
        <button
          role="tab"
          aria-selected={tab === "youtube"}
          onClick={() => setTab("youtube")}
        >
          Métricas do YouTube
        </button>
      </div>

      {tab === "content" && (
        <>
          <div className="admin-toolbar">
            <label>
              Buscar
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Título, slug ou tipo"
              />
            </label>
            <label>
              Estado
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Todos</option>
                {statusOptions.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-create-actions" aria-label="Criar conteúdo">
            {(projectsEnabled
              ? (["timeline", "review", "find", "category", "setting"] as const)
              : (["timeline", "category", "setting"] as const)
            ).map((type) => (
              <button key={type} onClick={() => setCreating(type)}>
                + {contentTypeLabel(type)}
              </button>
            ))}
          </div>
          <p className="admin-editorial-rule">
            Textos pessoais devem permanecer em primeira pessoa. Rascunhos,
            itens aguardando revisão e revisados não aparecem no site; somente o
            estado Publicado é público.
          </p>
          <section className="admin-entries">
            <h2>Conteúdos ativos</h2>
            {visibleEntries.map((entry) => (
              <article key={entry.id}>
                <span>{statusLabel(entry.status)}</span>
                <div>
                  <strong>{entry.title}</strong>
                  <small>
                    {contentTypeLabel(entry.type)} · {entry.slug}
                  </small>
                  {!projectsEnabled &&
                    (entry.type === "review" || entry.type === "find") && (
                      <small>Projeto preservado · sem publicação pública</small>
                    )}
                  {projectsEnabled && entry.featured && (
                    <small>Destaque de projetos</small>
                  )}
                  <small>Atualizado em {formatDate(entry.updatedAt)}</small>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => setEditing(entry)}>Editar</button>
                  {(projectsEnabled ||
                    (entry.type !== "review" && entry.type !== "find")) && (
                    <button onClick={() => toggleFeatured(entry)}>
                      {entry.featured ? "Remover destaque" : "Destacar"}
                    </button>
                  )}
                  <select
                    aria-label={`Alterar estado de ${entry.title}`}
                    value={
                      entry.status === "removed" ? "archived" : entry.status
                    }
                    onChange={(event) =>
                      changeStatus(entry, event.target.value as ContentStatus)
                    }
                  >
                    {statusOptions.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
            {!busy && !visibleEntries.length && (
              <p>Nenhum conteúdo corresponde aos filtros.</p>
            )}
          </section>
        </>
      )}

      {tab === "youtube" && (
        <>
          <div className="admin-row-actions">
            <button className="button primary" onClick={syncYouTube}>
              Sincronizar métricas agora
            </button>
          </div>
          <section
            className="admin-health-grid"
            aria-label="Estado das integrações"
          >
            {Object.entries(youtube.configuration || {}).map(([key, value]) => (
              <div key={key}>
                <span>{healthLabel(key)}</span>
                <strong>{value ? "Sim" : "Não"}</strong>
              </div>
            ))}
          </section>
          <section className="admin-preview">
            <h2>Snapshot público do canal</h2>
            <pre>{JSON.stringify(youtube.state, null, 2)}</pre>
          </section>
          <section className="admin-entries">
            <h2>Execuções recentes</h2>
            {youtube.runs.map((run, index) => (
              <article key={String(run.id ?? index)}>
                <span>{String(run.status ?? "")}</span>
                <div>
                  <strong>Métricas do canal</strong>
                  <small>{String(run.startedAt ?? "")}</small>
                  {run.errorCode ? <p>Erro: {String(run.errorCode)}</p> : null}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {editing && (
        <EditorModal
          title={`Editar ${editing.title}`}
          entry={editing}
          onClose={() => setEditing(null)}
          onSubmit={saveEdit}
        />
      )}
      {creating && (
        <EditorModal
          title={`Novo ${contentTypeLabel(creating)}`}
          entry={{
            id: "",
            type: creating,
            title: "",
            slug: "",
            payload: JSON.stringify(templateFor(creating), null, 2),
            status: "draft",
            featured: false,
            updatedAt: "",
          }}
          creating
          onClose={() => setCreating(null)}
          onSubmit={createEntry}
        />
      )}
    </section>
  );
}

function EditorModal({
  title,
  entry,
  creating = false,
  onClose,
  onSubmit,
}: {
  title: string;
  entry: Entry;
  creating?: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      className="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <form className="topic-form" onSubmit={onSubmit}>
        <h2>{title}</h2>
        <label>
          Título
          <input name="title" defaultValue={entry.title} required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={entry.slug} required />
        </label>
        <label>
          Dados estruturados
          <textarea
            name="payload"
            rows={18}
            defaultValue={formatJson(entry.payload)}
            required
          />
        </label>
        {!creating && (
          <label className="admin-check">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={entry.featured}
            />
            Conteúdo em destaque
          </label>
        )}
        <div className="admin-row-actions">
          <button className="button primary">Validar e salvar</button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function templateFor(type: ContentType) {
  if (type === "timeline") {
    return {
      dateLabel: "",
      datePrecision: "exact",
      title: "",
      description: "",
      imageUrl: null,
      number: null,
      relatedProject: null,
      youtubeUrl: null,
      position: 1,
      visualType: "origin",
      visualAsset: null,
      accentValue: "warm",
      primaryMetric: null,
      secondaryMetric: null,
      motionVariant: "origin",
      visualDescription: "",
      fallbackMode: "abstract",
    };
  }
  if (type === "setting") return { key: "", value: "" };
  if (type === "category") return { name: "", description: "", icon: "01" };
  if (type === "review") {
    return {
      manufacturer: "",
      category: "Reviews",
      summary: "",
      testedAt: "",
      pricePaid: null,
      marketPrice: null,
      repairCost: null,
      totalCost: null,
      verdict: null,
      positives: [],
      negatives: [],
      status: "",
      learning: "",
      facts: [],
      updatedAt: "",
      videoId: "",
      imageUrl: null,
    };
  }
  return {
    product: "",
    announcedPrice: null,
    negotiatedPrice: 0,
    announcedProblem: "",
    repairCost: null,
    totalCost: null,
    salePrice: null,
    reimbursement: null,
    result: "",
    currentStatus: "",
    learning: "",
    videoId: "",
    imageUrl: null,
    tags: ["Garimpos"],
    updatedAt: "",
    timeline: [],
  };
}

async function getJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Falha ao carregar.");
  return data;
}

async function adminFetch(url: string, method: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return {
      ok: response.ok,
      error: data.error || data.errors?.join(" ") || "Falha na operação.",
    };
  } catch {
    return { ok: false, error: "Não foi possível conectar ao servidor." };
  }
}

function parseJson(value: FormDataEntryValue | null) {
  try {
    return { ok: true as const, value: JSON.parse(String(value || "{}")) };
  } catch {
    return { ok: false as const, error: "Os dados não formam JSON válido." };
  }
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function messageFrom(value: unknown) {
  return value instanceof Error ? value.message : "Falha inesperada.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: ContentStatus) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

function contentTypeLabel(type: ContentType) {
  return {
    review: "Projeto · review",
    find: "Projeto · garimpo/reparo",
    category: "Categoria",
    setting: "Configuração",
    timeline: "Marco da história",
  }[type];
}

function healthLabel(key: string) {
  const labels: Record<string, string> = {
    apiConfigured: "API do YouTube configurada",
    channelFound: "Canal encontrado",
    metricsAvailable: "Métricas disponíveis",
    snapshotStale: "Snapshot antigo",
    telegramConfigured: "Telegram configurado",
    mediaKitConfigured: "Media Kit configurado",
    commercialEmailConfigured: "Contato comercial configurado",
    introAvailable: "Arquivos da intro disponíveis",
    d1Connected: "Banco editorial conectado",
    introEnabled: "Intro ativa",
  };
  return labels[key] || key;
}
