"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Entry = {
  id: string;
  type: string;
  title: string;
  slug: string;
  payload: string;
  status: string;
  featured: boolean;
  updatedAt: string;
};
type WallTopic = {
  id: string;
  categoryId: string;
  displayName: string;
  title: string;
  body: string;
  status: string;
  isOfficial: boolean;
  replyCount: number;
  closedAt: string | null;
  pinnedAt: string | null;
  createdAt: string;
};
type WallReply = {
  id: string;
  topicId: string;
  displayName: string;
  body: string;
  status: string;
  isOfficial: boolean;
  createdAt: string;
};
type WallReport = {
  id: string;
  targetType: "topic" | "reply";
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};
type WallCategory = {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  position: number;
};
type WallBlock = {
  id: string;
  reason: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
};
type HistoryItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
};
type YouTubeHealth = {
  state: null | Record<string, unknown>;
  runs: Array<Record<string, unknown>>;
};

const payloadExamples: Record<string, Record<string, unknown>> = {
  review: {
    manufacturer: "",
    category: "Smartphones",
    summary: "",
    testedAt: "2026-07-14",
    pricePaid: null,
    marketPrice: null,
    repairCost: null,
    totalCost: null,
    verdict: null,
    positives: [],
    negatives: [],
    facts: [],
    status: "",
    updatedAt: "2026-07-14",
    videoId: "",
  },
  find: {
    product: "",
    negotiatedPrice: 0,
    announcedPrice: null,
    announcedProblem: "",
    repairCost: null,
    totalCost: null,
    salePrice: null,
    reimbursement: null,
    result: "",
    currentStatus: "",
    videoId: "",
    tags: [],
    timeline: [],
    updatedAt: "2026-07-14",
  },
  video: {
    id: "",
    title: "",
    category: "Reviews",
    tags: [],
    summary: "",
    relatedReviewSlug: null,
    relatedFindSlug: null,
  },
  category: { name: "", icon: "10", description: "", relation: "" },
  setting: { key: "telegram_channel_url", value: "" },
  timeline: { year: "", title: "", description: "", position: 1 },
};

export function AdminPanel() {
  const [tab, setTab] = useState<"content" | "mural" | "youtube">("content");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topics, setTopics] = useState<WallTopic[]>([]);
  const [replies, setReplies] = useState<WallReply[]>([]);
  const [reports, setReports] = useState<WallReport[]>([]);
  const [categories, setCategories] = useState<WallCategory[]>([]);
  const [blocks, setBlocks] = useState<WallBlock[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [youtube, setYoutube] = useState<YouTubeHealth>({
    state: null,
    runs: [],
  });
  const [editing, setEditing] = useState<Entry | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadContent = useCallback(async () => {
    const data = await getJson("/api/admin/content");
    setEntries(data.entries ?? []);
  }, []);
  const loadMural = useCallback(async () => {
    const data = await getJson("/api/admin/moderation");
    setTopics(data.topics ?? []);
    setReplies(data.replies ?? []);
    setReports(data.reports ?? []);
    setCategories(data.categories ?? []);
    setBlocks(data.blocks ?? []);
    setHistory(data.history ?? []);
  }, []);
  const loadYouTube = useCallback(async () => {
    setYoutube(await getJson("/api/admin/youtube"));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const operation =
      tab === "content"
        ? loadContent()
        : tab === "mural"
          ? loadMural()
          : loadYouTube();
    operation
      .catch((caught) => setError(messageFrom(caught)))
      .finally(() => setLoading(false));
  }, [loadContent, loadMural, loadYouTube, tab]);

  const visibleTopics = useMemo(
    () => topics.filter((item) => matches(item, query, statusFilter)),
    [query, statusFilter, topics],
  );
  const visibleReplies = useMemo(
    () => replies.filter((item) => matches(item, query, statusFilter)),
    [query, replies, statusFilter],
  );
  const visibleReports = useMemo(
    () => reports.filter((item) => matches(item, query, statusFilter)),
    [query, reports, statusFilter],
  );

  async function createContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    const form = new FormData(event.currentTarget);
    const payload = parseJson(form.get("payload"));
    if (!payload.ok) return setError(payload.error);
    const response = await adminFetch("/api/admin/content", "POST", {
      type: form.get("type"),
      title: form.get("title"),
      slug: form.get("slug"),
      payload: payload.value,
    });
    if (!response.ok) return setError(response.error);
    event.currentTarget.reset();
    setMessage("Rascunho validado e criado.");
    await loadContent();
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const payload = parseJson(form.get("payload"));
    if (!payload.ok) return setError(payload.error);
    const response = await adminFetch("/api/admin/content", "PATCH", {
      id: editing.id,
      title: form.get("title"),
      slug: form.get("slug"),
      payload: payload.value,
    });
    if (!response.ok) return setError(response.error);
    setEditing(null);
    setMessage("Conteúdo validado e salvo.");
    await loadContent();
  }

  async function updateEntry(id: string, changes: Record<string, unknown>) {
    const response = await adminFetch("/api/admin/content", "PATCH", {
      id,
      ...changes,
    });
    if (!response.ok) return setError(response.error);
    setMessage("Conteúdo atualizado e auditado.");
    await loadContent();
  }

  async function removeEntry(id: string) {
    const reason = window.prompt(
      "Motivo da remoção lógica (mínimo de 8 caracteres):",
    );
    if (!reason) return;
    const response = await adminFetch("/api/admin/content", "DELETE", {
      id,
      reason,
    });
    if (!response.ok) return setError(response.error);
    setMessage("Conteúdo removido logicamente.");
    await loadContent();
  }

  async function moderate(
    action: string,
    targetType: string,
    targetId: string,
    extra: Record<string, unknown> = {},
  ) {
    clearFeedback();
    let reason = "";
    if (
      [
        "hide",
        "remove",
        "spam",
        "block-hash",
        "hard-delete",
        "dismiss-report",
      ].includes(action)
    ) {
      reason = window.prompt("Motivo da ação (mínimo de 8 caracteres):") || "";
      if (!reason) return;
    }
    let confirmation: string | undefined;
    if (action === "hard-delete") {
      confirmation =
        window.prompt('Digite "EXCLUIR PERMANENTEMENTE" para confirmar:') || "";
      if (confirmation !== "EXCLUIR PERMANENTEMENTE") return;
    }
    const response = await adminFetch("/api/admin/moderation", "POST", {
      action,
      targetType,
      targetId,
      reason,
      confirmation,
      ...extra,
    });
    if (!response.ok) return setError(response.error);
    setMessage("Ação concluída e registrada no histórico.");
    await loadMural();
  }

  async function createOfficialTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await adminFetch("/api/admin/moderation", "POST", {
      action: "official-create",
      targetType: "topic",
      targetId: "new",
      categoryId: form.get("categoryId"),
      title: form.get("title"),
      body: form.get("body"),
    });
    if (!response.ok) return setError(response.error);
    event.currentTarget.reset();
    setMessage("Publicação oficial criada.");
    await loadMural();
  }

  async function createOfficialReply(topicId: string) {
    const body = window.prompt("Resposta oficial:");
    if (!body) return;
    await moderate("official-create", "reply", "new", { topicId, body });
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await adminFetch("/api/admin/moderation", "POST", {
      action: "create",
      targetType: "category",
      targetId: "new",
      name: form.get("name"),
      description: form.get("description"),
      position: form.get("position"),
    });
    if (!response.ok) return setError(response.error);
    event.currentTarget.reset();
    await loadMural();
  }

  async function moveTopic(topic: WallTopic) {
    const categoryId = window.prompt(
      `ID da nova categoria:\n${categories
        .map((item) => `${item.id} — ${item.name}`)
        .join("\n")}`,
      topic.categoryId,
    );
    if (categoryId && categoryId !== topic.categoryId) {
      await moderate("move", "topic", topic.id, { categoryId });
    }
  }

  async function editCategory(item: WallCategory) {
    const name = window.prompt("Nome da categoria:", item.name);
    if (!name) return;
    const description = window.prompt("Descrição:", item.description);
    if (description === null) return;
    const position = Number(window.prompt("Posição:", String(item.position)));
    await moderate("update", "category", item.id, {
      name,
      description,
      position,
    });
  }

  async function syncYouTube(mode: "incremental" | "full") {
    clearFeedback();
    setLoading(true);
    const response = await adminFetch("/api/admin/youtube", "POST", { mode });
    setLoading(false);
    if (!response.ok) return setError(response.error);
    setMessage("Sincronização concluída. Consulte o estado abaixo.");
    await loadYouTube();
  }

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  return (
    <section className="admin-workspace">
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Áreas do proprietário"
      >
        {(["content", "mural", "youtube"] as const).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
          >
            {item === "content"
              ? "Conteúdo"
              : item === "mural"
                ? "Mural"
                : "YouTube"}
          </button>
        ))}
      </div>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Carregando área privada…</p>}

      {tab === "content" && (
        <>
          <form className="topic-form" onSubmit={createContent}>
            <h2>Novo conteúdo editorial</h2>
            <label>
              Tipo
              <select
                name="type"
                onChange={(event) => {
                  const textarea =
                    event.currentTarget.form?.elements.namedItem("payload");
                  if (textarea instanceof HTMLTextAreaElement)
                    textarea.value = JSON.stringify(
                      payloadExamples[event.target.value],
                      null,
                      2,
                    );
                }}
              >
                {Object.keys(payloadExamples).map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input name="title" required minLength={3} maxLength={160} />
            </label>
            <label>
              Slug
              <input name="slug" required minLength={3} pattern="[a-z0-9-]+" />
            </label>
            <label>
              Dados estruturados
              <textarea
                name="payload"
                rows={12}
                defaultValue={JSON.stringify(payloadExamples.review, null, 2)}
                required
              />
            </label>
            <button className="button primary">
              Validar e salvar rascunho
            </button>
          </form>
          <section className="admin-entries">
            <h2>Conteúdo gerenciável</h2>
            {entries.map((entry) => (
              <article key={entry.id}>
                <span>{entry.type}</span>
                <div>
                  <strong>{entry.title}</strong>
                  <small>
                    /{entry.slug} · {entry.status}
                  </small>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => setEditing(entry)}>Editar</button>
                  <button
                    onClick={() =>
                      updateEntry(entry.id, { featured: !entry.featured })
                    }
                  >
                    {entry.featured ? "Remover destaque" : "Destacar"}
                  </button>
                  <button
                    onClick={() =>
                      updateEntry(entry.id, { status: "published" })
                    }
                  >
                    Publicar/restaurar
                  </button>
                  <button
                    onClick={() =>
                      updateEntry(entry.id, { status: "archived" })
                    }
                  >
                    Arquivar
                  </button>
                  <button onClick={() => removeEntry(entry.id)}>Remover</button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {tab === "mural" && (
        <>
          <div className="community-tools">
            <label>
              <span>Pesquisar</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {[
                  "pending",
                  "published",
                  "hidden",
                  "removed",
                  "spam",
                  "open",
                  "reviewing",
                  "resolved",
                  "dismissed",
                ].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <form className="topic-form" onSubmit={createOfficialTopic}>
            <h2>Publicação oficial</h2>
            <label>
              Categoria
              <select name="categoryId">
                {categories.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input name="title" minLength={8} maxLength={120} required />
            </label>
            <label>
              Mensagem
              <textarea name="body" minLength={15} maxLength={4000} required />
            </label>
            <button className="button primary">
              Publicar como Ryan — Imports Tech
            </button>
          </form>
          <section className="admin-entries">
            <h2>Publicações</h2>
            {visibleTopics.map((topic) => (
              <article key={topic.id}>
                <span>{topic.status}</span>
                <div>
                  <strong>{topic.title}</strong>
                  <small>
                    {topic.displayName} · {topic.replyCount} respostas ·{" "}
                    {topic.categoryId}
                  </small>
                  <p>{topic.body}</p>
                </div>
                <div className="admin-row-actions">
                  <button
                    onClick={() =>
                      moderate(
                        topic.status === "published" ? "hide" : "restore",
                        "topic",
                        topic.id,
                      )
                    }
                  >
                    {topic.status === "published" ? "Ocultar" : "Restaurar"}
                  </button>
                  <button
                    onClick={() =>
                      moderate(
                        topic.pinnedAt ? "unpin" : "pin",
                        "topic",
                        topic.id,
                      )
                    }
                  >
                    {topic.pinnedAt ? "Desafixar" : "Fixar"}
                  </button>
                  <button
                    onClick={() =>
                      moderate(
                        topic.closedAt ? "reopen" : "close",
                        "topic",
                        topic.id,
                      )
                    }
                  >
                    {topic.closedAt ? "Reabrir" : "Encerrar"}
                  </button>
                  <button onClick={() => createOfficialReply(topic.id)}>
                    Responder oficial
                  </button>
                  <button onClick={() => moveTopic(topic)}>Mover</button>
                  {!topic.isOfficial && (
                    <button
                      onClick={() =>
                        moderate("block-hash", "topic", topic.id, {
                          blockHours: 24,
                        })
                      }
                    >
                      Bloquear 24h
                    </button>
                  )}
                  <button onClick={() => moderate("spam", "topic", topic.id)}>
                    Spam
                  </button>
                  <button onClick={() => moderate("remove", "topic", topic.id)}>
                    Remover
                  </button>
                  <button
                    onClick={() => moderate("hard-delete", "topic", topic.id)}
                  >
                    Excluir definitivamente
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="admin-entries">
            <h2>Respostas</h2>
            {visibleReplies.map((reply) => (
              <article key={reply.id}>
                <span>{reply.status}</span>
                <div>
                  <strong>{reply.displayName}</strong>
                  <small>Tópico {reply.topicId}</small>
                  <p>{reply.body}</p>
                </div>
                <div className="admin-row-actions">
                  <button
                    onClick={() =>
                      moderate(
                        reply.status === "published" ? "hide" : "restore",
                        "reply",
                        reply.id,
                      )
                    }
                  >
                    {reply.status === "published" ? "Ocultar" : "Restaurar"}
                  </button>
                  <button onClick={() => moderate("spam", "reply", reply.id)}>
                    Spam
                  </button>
                  {!reply.isOfficial && (
                    <button
                      onClick={() =>
                        moderate("block-hash", "reply", reply.id, {
                          blockHours: 24,
                        })
                      }
                    >
                      Bloquear 24h
                    </button>
                  )}
                  <button
                    onClick={() => moderate("hard-delete", "reply", reply.id)}
                  >
                    Excluir definitivamente
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="admin-entries">
            <h2>Denúncias</h2>
            {visibleReports.map((report) => (
              <article key={report.id}>
                <span>{report.status}</span>
                <div>
                  <strong>
                    {report.targetType} · {report.targetId}
                  </strong>
                  <p>{report.reason}</p>
                </div>
                <div className="admin-row-actions">
                  <button
                    onClick={() =>
                      moderate("review-report", "report", report.id)
                    }
                  >
                    Analisar
                  </button>
                  <button
                    onClick={() =>
                      moderate("resolve-report", "report", report.id)
                    }
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() =>
                      moderate("dismiss-report", "report", report.id)
                    }
                  >
                    Dispensar
                  </button>
                </div>
              </article>
            ))}
          </section>
          <form className="topic-form" onSubmit={createCategory}>
            <h2>Nova categoria</h2>
            <label>
              Nome
              <input name="name" minLength={3} required />
            </label>
            <label>
              Descrição
              <input name="description" />
            </label>
            <label>
              Posição
              <input name="position" type="number" defaultValue={99} />
            </label>
            <button>Criar categoria</button>
          </form>
          <section className="admin-entries">
            <h2>Categorias</h2>
            {categories.map((item) => (
              <article key={item.id}>
                <span>{item.status}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => editCategory(item)}>Editar</button>
                  <button
                    onClick={() =>
                      moderate(
                        item.status === "active" ? "archive" : "restore",
                        "category",
                        item.id,
                      )
                    }
                  >
                    {item.status === "active" ? "Arquivar" : "Restaurar"}
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="admin-entries">
            <h2>Bloqueios de origem</h2>
            {blocks.map((item) => (
              <article key={item.id}>
                <span>{item.active ? "ativo" : "encerrado"}</span>
                <div>
                  <strong>{item.reason}</strong>
                  <small>
                    Expira em {new Date(item.expiresAt).toLocaleString("pt-BR")}
                  </small>
                </div>
                <div className="admin-row-actions">
                  {item.active && (
                    <button onClick={() => moderate("lift", "block", item.id)}>
                      Encerrar bloqueio
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
          <section className="admin-entries">
            <h2>Histórico</h2>
            {history.map((item) => (
              <article key={item.id}>
                <span>{item.targetType}</span>
                <div>
                  <strong>{item.action}</strong>
                  <small>
                    {item.targetId} ·{" "}
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </small>
                  {item.reason && <p>{item.reason}</p>}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {tab === "youtube" && (
        <>
          <div className="admin-row-actions">
            <button
              className="button primary"
              onClick={() => syncYouTube("incremental")}
            >
              Sincronizar agora
            </button>
            <button
              className="button secondary"
              onClick={() => syncYouTube("full")}
            >
              Sincronização completa
            </button>
          </div>
          <section className="admin-preview">
            <h2>Saúde da sincronização</h2>
            <pre>{JSON.stringify(youtube.state, null, 2)}</pre>
          </section>
          <section className="admin-entries">
            <h2>Execuções recentes</h2>
            {youtube.runs.map((run, index) => (
              <article key={String(run.id ?? index)}>
                <span>{String(run.status ?? "")}</span>
                <div>
                  <strong>{String(run.mode ?? "")}</strong>
                  <small>{String(run.startedAt ?? "")}</small>
                  {run.errorMessage ? <p>{String(run.errorMessage)}</p> : null}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {editing && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Editar conteúdo"
        >
          <form className="topic-form" onSubmit={saveEdit}>
            <h2>Editar {editing.title}</h2>
            <label>
              Título
              <input name="title" defaultValue={editing.title} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={editing.slug} required />
            </label>
            <label>
              Dados estruturados
              <textarea
                name="payload"
                rows={16}
                defaultValue={formatJson(editing.payload)}
                required
              />
            </label>
            <div className="admin-row-actions">
              <button className="button primary">Validar e salvar</button>
              <button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function matches(item: Record<string, unknown>, query: string, status: string) {
  const matchesStatus = status === "all" || item.status === status;
  const haystack = Object.values(item)
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("pt-BR");
  return (
    matchesStatus && haystack.includes(query.trim().toLocaleLowerCase("pt-BR"))
  );
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
    return {
      ok: false as const,
      error: "Os dados estruturados não formam JSON válido.",
    };
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
