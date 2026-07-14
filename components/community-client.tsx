"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicReply, PublicTopic } from "@/lib/community-domain";
import { normalizeSearch } from "@/lib/search";

export function CommunityClient({
  categories,
  userName,
}: {
  categories: string[];
  userName: string;
}) {
  const [topics, setTopics] = useState<PublicTopic[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "replied">("recent");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/community/topics", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao carregar.");
      setTopics(data.topics || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      topics
        .filter((topic) =>
          normalizeSearch(
            `${topic.title} ${topic.body} ${topic.category}`,
          ).includes(normalizeSearch(query)),
        )
        .sort((a, b) =>
          sort === "replied"
            ? b.replyCount - a.replyCount
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [topics, query, sort],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/community/topics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        body: form.get("body"),
        category: form.get("category"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(
        data.errors?.join(" ") || data.error || "Não foi possível publicar.",
      );
      return;
    }
    event.currentTarget.reset();
    setOpen(false);
    setMessage("Tópico publicado.");
    await load();
  }

  async function anonymizeAccount() {
    if (
      !window.confirm("Anonimizar sua conta e seu nome público na comunidade?")
    ) {
      return;
    }
    const response = await fetch("/api/community/account", {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Não foi possível anonimizar a conta.");
      return;
    }
    window.location.href = "/signout-with-chatgpt?return_to=%2Fcomunidade";
  }

  return (
    <section className="community-shell">
      <div className="community-welcome">
        <div>
          <span>Conectado como</span>
          <strong>{userName}</strong>
        </div>
        <div className="community-actions">
          <button type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Fechar formulário" : "Criar tópico"}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={anonymizeAccount}
          >
            Anonimizar minha conta
          </button>
        </div>
      </div>

      {open && (
        <form className="topic-form" onSubmit={submit}>
          <label>
            Categoria
            <select name="category" required>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input name="title" minLength={8} maxLength={120} required />
          </label>
          <label>
            Contexto
            <textarea
              name="body"
              minLength={20}
              maxLength={4000}
              rows={6}
              required
            />
          </label>
          <small>Máximo de dois links. Não publique dados pessoais.</small>
          <button className="button primary" type="submit">
            Publicar tópico
          </button>
        </form>
      )}

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

      <div className="community-tools">
        <label>
          <span>Pesquisar tópicos</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Produto, dúvida ou categoria"
          />
        </label>
        <label>
          <span>Ordenar tópicos</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="recent">Mais recentes</option>
            <option value="replied">Mais respondidos</option>
          </select>
        </label>
      </div>

      <div className="category-pills" aria-label="Filtrar por categoria">
        {categories.map((item) => (
          <button type="button" key={item} onClick={() => setQuery(item)}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state" role="status">
          <strong>Carregando conversas…</strong>
        </div>
      ) : visible.length ? (
        <div className="topic-list">
          {visible.map((topic) => (
            <Link href={`/comunidade/${topic.id}`} key={topic.id}>
              <span>{topic.category}</span>
              <div>
                <strong>{topic.title}</strong>
                <p>{topic.body}</p>
                <small>
                  {topic.author.displayName} · {formatDate(topic.createdAt)}
                </small>
              </div>
              <b>{topic.replyCount} respostas</b>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhum tópico encontrado.</strong>
          <p>Inicie uma conversa útil e contextualizada.</p>
        </div>
      )}
    </section>
  );
}

export function CommunityTopicClient({
  id,
  userName,
}: {
  id: string;
  userName: string;
}) {
  const [topic, setTopic] = useState<PublicTopic | null>(null);
  const [replies, setReplies] = useState<PublicReply[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/community/topics/${id}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Não foi possível carregar o tópico.");
      return;
    }
    setTopic(data.topic || null);
    setReplies(data.replies || []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/community/topics/${id}/replies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: form.get("body") }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Não foi possível responder.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Resposta publicada.");
    await load();
  }

  async function report(
    event: FormEvent<HTMLFormElement>,
    targetType: "topic" | "reply",
    targetId: string,
  ) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/community/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        reason: form.get("reason"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Não foi possível registrar a denúncia.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Denúncia registrada para análise.");
  }

  if (error && !topic)
    return (
      <p className="form-message error" role="alert">
        {error}
      </p>
    );
  if (!topic) {
    return (
      <div className="empty-state" role="status">
        <strong>Carregando tópico…</strong>
      </div>
    );
  }

  return (
    <section className="topic-detail">
      <Link href="/comunidade">← Voltar à comunidade</Link>
      <article className="topic-original">
        <span>{topic.category}</span>
        <h1>{topic.title}</h1>
        <p>{topic.body}</p>
        <small>Publicado por {topic.author.displayName}</small>
        <ReportForm onSubmit={(event) => report(event, "topic", topic.id)} />
      </article>
      <h2>{replies.length} respostas</h2>
      <div className="replies-list">
        {replies.map((item) => (
          <article key={item.id}>
            <p>{item.body}</p>
            <small>
              {item.author.displayName} · {formatDate(item.createdAt)}
            </small>
            <ReportForm onSubmit={(event) => report(event, "reply", item.id)} />
          </article>
        ))}
      </div>
      <form className="topic-form" onSubmit={reply}>
        <label>
          Responder como {userName}
          <textarea
            name="body"
            minLength={4}
            maxLength={2000}
            rows={5}
            required
          />
        </label>
        <button className="button primary">Publicar resposta</button>
      </form>
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
    </section>
  );
}

function ReportForm({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <details className="report-control">
      <summary>Denunciar conteúdo</summary>
      <form onSubmit={onSubmit}>
        <label>
          Motivo da denúncia
          <textarea name="reason" minLength={10} maxLength={500} required />
        </label>
        <button type="submit">Enviar denúncia</button>
      </form>
    </details>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
