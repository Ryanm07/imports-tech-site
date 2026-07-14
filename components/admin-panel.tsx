"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

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

type Report = {
  id: string;
  targetType: "topic" | "reply";
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: string;
  target: null | {
    id: string;
    title?: string;
    body: string;
    status: string;
    authorId: string;
    authorDisplayName: string;
  };
};

type HistoryItem = {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
};

type StaffUser = {
  id: string;
  displayName: string;
  role: "user" | "moderator" | "admin";
  status: string;
  blockedUntil: string | null;
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
  video: { id: "", title: "", category: "Reviews", tags: [], summary: "" },
  category: { name: "", icon: "10", description: "", relation: "" },
  setting: { key: "", value: "" },
};

export function AdminPanel({
  currentRole,
}: {
  currentRole: "moderator" | "admin";
}) {
  const [tab, setTab] = useState<"content" | "moderation">("content");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [preview, setPreview] = useState<Entry | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentPage, setContentPage] = useState(1);
  const [moderationPage, setModerationPage] = useState(1);
  const [contentHasMore, setContentHasMore] = useState(false);
  const [moderationHasMore, setModerationHasMore] = useState(false);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content?page=${contentPage}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao carregar conteúdo.");
      setEntries(data.entries || []);
      setContentHasMore(Boolean(data.hasMore));
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setLoading(false);
    }
  }, [contentPage]);

  const loadModeration = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/moderation?page=${moderationPage}`,
        {
          cache: "no-store",
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao carregar moderação.");
      setReports(data.reports || []);
      setHistory(data.history || []);
      setUsers(data.users || []);
      setModerationHasMore(Boolean(data.hasMore));
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setLoading(false);
    }
  }, [moderationPage]);

  useEffect(() => {
    if (tab === "content") void loadContent();
    else void loadModeration();
  }, [tab, loadContent, loadModeration]);

  async function create(event: FormEvent<HTMLFormElement>) {
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
    clearFeedback();
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
    setMessage("Alterações validadas e salvas.");
    await loadContent();
  }

  async function updateEntry(id: string, changes: Record<string, unknown>) {
    clearFeedback();
    const response = await adminFetch("/api/admin/content", "PATCH", {
      id,
      ...changes,
    });
    if (!response.ok) return setError(response.error);
    setMessage("Conteúdo atualizado.");
    await loadContent();
  }

  async function removeEntry(id: string) {
    const reason = window.prompt(
      "Motivo da remoção lógica (mínimo de 8 caracteres):",
    );
    if (!reason) return;
    clearFeedback();
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
    const needsReason = [
      "hide",
      "remove",
      "block",
      "ban",
      "role",
      "dismiss-report",
    ].includes(action);
    const reason = needsReason
      ? window.prompt("Motivo da ação (mínimo de 8 caracteres):")
      : "";
    if (needsReason && !reason) return;
    clearFeedback();
    const response = await adminFetch("/api/admin/moderation", "POST", {
      action,
      targetType,
      targetId,
      reason,
      ...extra,
    });
    if (!response.ok) return setError(response.error);
    setMessage("Ação de moderação concluída e auditada.");
    await loadModeration();
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
        aria-label="Áreas administrativas"
      >
        <button
          role="tab"
          aria-selected={tab === "content"}
          onClick={() => setTab("content")}
        >
          Conteúdo
        </button>
        <button
          role="tab"
          aria-selected={tab === "moderation"}
          onClick={() => setTab("moderation")}
        >
          Moderação
        </button>
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
      {loading && <p role="status">Carregando área administrativa…</p>}

      {tab === "content" && (
        <>
          <form className="topic-form" onSubmit={create}>
            <h2>Novo conteúdo</h2>
            <label>
              Tipo
              <select
                name="type"
                onChange={(event) => {
                  const textarea =
                    event.currentTarget.form?.elements.namedItem("payload");
                  if (textarea instanceof HTMLTextAreaElement) {
                    textarea.value = JSON.stringify(
                      payloadExamples[event.target.value],
                      null,
                      2,
                    );
                  }
                }}
              >
                <option value="review">Review</option>
                <option value="find">Garimpo</option>
                <option value="video">Vídeo</option>
                <option value="category">Categoria</option>
                {currentRole === "admin" && (
                  <option value="setting">Configuração</option>
                )}
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
                rows={14}
                defaultValue={JSON.stringify(payloadExamples.review, null, 2)}
                required
              />
            </label>
            <button className="button primary">
              Validar e salvar rascunho
            </button>
          </form>

          <div className="admin-entries">
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
                  <button onClick={() => setPreview(entry)}>Prévia</button>
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
                    Publicar
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
            {!loading && !entries.length && (
              <div className="empty-state">
                <strong>Nenhum conteúdo administrativo.</strong>
              </div>
            )}
          </div>
          <Pagination
            page={contentPage}
            hasMore={contentHasMore}
            onChange={setContentPage}
          />
        </>
      )}

      {tab === "moderation" && (
        <>
          <section className="admin-entries">
            <h2>Denúncias abertas</h2>
            {reports.map((report) => (
              <article key={report.id} className="moderation-report">
                <div>
                  <strong>
                    {report.target?.title || `${report.targetType} denunciada`}
                  </strong>
                  <p>{report.target?.body || "Conteúdo não localizado."}</p>
                  <small>
                    Denunciado por {report.reporter}: {report.reason}
                  </small>
                </div>
                <div className="admin-row-actions">
                  {report.target && (
                    <>
                      <button
                        onClick={() =>
                          moderate("hide", report.targetType, report.targetId)
                        }
                      >
                        Ocultar
                      </button>
                      <button
                        onClick={() =>
                          moderate("remove", report.targetType, report.targetId)
                        }
                      >
                        Remover
                      </button>
                      <button
                        onClick={() =>
                          moderate(
                            "restore",
                            report.targetType,
                            report.targetId,
                          )
                        }
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() =>
                          moderate("block", "user", report.target!.authorId, {
                            blockHours: 24,
                          })
                        }
                      >
                        Bloquear 24h
                      </button>
                      <button
                        onClick={() =>
                          moderate("ban", "user", report.target!.authorId)
                        }
                      >
                        Banir
                      </button>
                      <button
                        onClick={() =>
                          moderate("unblock", "user", report.target!.authorId)
                        }
                      >
                        Desbloquear
                      </button>
                    </>
                  )}
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
            {!loading && !reports.length && <p>Nenhuma denúncia aberta.</p>}
          </section>
          <Pagination
            page={moderationPage}
            hasMore={moderationHasMore}
            onChange={setModerationPage}
          />

          {currentRole === "admin" && (
            <section className="admin-entries">
              <h2>Papéis persistidos</h2>
              {users.map((user) => (
                <article key={user.id}>
                  <div>
                    <strong>{user.displayName}</strong>
                    <small>{user.status}</small>
                  </div>
                  <select
                    value={user.role}
                    aria-label={`Papel de ${user.displayName}`}
                    onChange={(event) =>
                      moderate("role", "user", user.id, {
                        role: event.target.value,
                      })
                    }
                  >
                    <option value="user">Usuário</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </article>
              ))}
            </section>
          )}

          <section className="admin-entries">
            <h2>Histórico de moderação</h2>
            {history.map((item) => (
              <article key={item.id}>
                <span>{item.actorRole}</span>
                <div>
                  <strong>{item.action}</strong>
                  <small>
                    {item.targetType} ·{" "}
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </small>
                  {item.reason && <p>{item.reason}</p>}
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

      {preview && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Prévia de conteúdo"
        >
          <article className="admin-preview">
            <span>
              {preview.type} · {preview.status}
            </span>
            <h2>{preview.title}</h2>
            <pre>{formatJson(preview.payload)}</pre>
            <button onClick={() => setPreview(null)}>Fechar prévia</button>
          </article>
        </div>
      )}
    </section>
  );
}

function Pagination({
  page,
  hasMore,
  onChange,
}: {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>Página {page}</span>
      <button disabled={!hasMore} onClick={() => onChange(page + 1)}>
        Próxima
      </button>
    </nav>
  );
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
    const parsed = JSON.parse(String(value || "{}"));
    return { ok: true as const, value: parsed };
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
