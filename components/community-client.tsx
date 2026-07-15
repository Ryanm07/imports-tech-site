"use client";

import Link from "next/link";
import Script from "next/script";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WALL_CATEGORY_FALLBACKS } from "@/lib/wall-domain";
import type {
  PublicWallReply,
  PublicWallTopic,
  WallCategory,
} from "@/lib/wall-domain";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "dark";
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

type CommunityProps = { turnstileSiteKey: string };

const quickActions = [
  ["Sugerir um vídeo", "Sugestões de vídeo"],
  ["Mostrar um achado", "Garimpos e OLX"],
  ["Pedir ajuda", "Ajuda técnica"],
  ["Conversar sobre tecnologia", "Assuntos gerais"],
] as const;

export function CommunityClient({ turnstileSiteKey }: CommunityProps) {
  const [topics, setTopics] = useState<PublicWallTopic[]>([]);
  const [categories, setCategories] = useState<WallCategory[]>(
    WALL_CATEGORY_FALLBACKS,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"recent" | "replied">("recent");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [turnstileReady, setTurnstileReady] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [presetCategory, setPresetCategory] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ sort });
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      const [topicsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/community/topics?${params}`, { cache: "no-store" }),
        fetch("/api/community/categories", { cache: "no-store" }),
      ]);
      const topicData = await topicsResponse.json().catch(() => ({}));
      const categoryData = await categoriesResponse.json().catch(() => ({}));
      if (!topicsResponse.ok)
        throw new Error(topicData.error || "Falha ao carregar o mural.");
      if (!categoriesResponse.ok)
        throw new Error(categoryData.error || "Falha ao carregar categorias.");
      setTopics(topicData.topics ?? []);
      setCategories(categoryData.categories ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Falha ao carregar o mural.",
      );
    } finally {
      setLoading(false);
    }
  }, [category, query, sort]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [load, query]);

  const activeCategories = useMemo(
    () => categories.filter((item) => item.status === "active"),
    [categories],
  );

  function chooseQuickAction(categoryName: string) {
    const selected = activeCategories.find(
      (item) => normalizeLabel(item.name) === normalizeLabel(categoryName),
    );
    setPresetCategory(selected?.id || "");
    setOpen(true);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      titleRef.current?.focus();
    }, 40);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!turnstileToken) {
      setError("Conclua a verificação anti-spam para publicar.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/community/topics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        title: form.get("title"),
        body: form.get("body"),
        categoryId: form.get("categoryId"),
        website: form.get("website"),
        turnstileToken,
      }),
    });
    const data = await response.json();
    setTurnstileToken("");
    setTurnstileReset((value) => value + 1);
    if (!response.ok) {
      setError(
        data.errors?.join(" ") || data.error || "Não foi possível publicar.",
      );
      return;
    }
    event.currentTarget.reset();
    setPresetCategory("");
    setOpen(false);
    setMessage(
      response.status === 202
        ? "Publicação recebida e encaminhada para análise."
        : "Publicação adicionada ao mural.",
    );
    await load();
  }

  return (
    <section className="community-shell">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady((value) => value + 1)}
      />
      <div className="community-welcome">
        <div>
          <span>PARTICIPAÇÃO SIMPLES</span>
          <strong>Sem cadastro e sem e-mail</strong>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "Fechar formulário" : "Criar publicação"}
        </button>
      </div>

      <div className="wall-quick-actions" aria-label="Começar uma conversa">
        {quickActions.map(([label, categoryName]) => (
          <button
            type="button"
            key={label}
            onClick={() => chooseQuickAction(categoryName)}
          >
            <span aria-hidden="true">→</span>
            {label}
          </button>
        ))}
      </div>

      {open && (
        <form className="topic-form" onSubmit={submit} ref={formRef}>
          <label>
            Nome que será exibido
            <input name="displayName" minLength={2} maxLength={30} required />
          </label>
          <small>O nome é informado pelo visitante e não é verificado.</small>
          <label>
            Categoria
            <select
              name="categoryId"
              required
              value={presetCategory}
              onChange={(event) => setPresetCategory(event.target.value)}
            >
              <option value="" disabled>
                Escolha uma categoria
              </option>
              {activeCategories.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input
              ref={titleRef}
              name="title"
              minLength={8}
              maxLength={120}
              required
            />
          </label>
          <label>
            Mensagem
            <textarea
              name="body"
              minLength={15}
              maxLength={4000}
              rows={6}
              required
            />
          </label>
          <label className="wall-honeypot" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <small>Máximo de dois links. Não publique dados pessoais.</small>
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            ready={turnstileReady}
            reset={turnstileReset}
            onToken={setTurnstileToken}
          />
          <button className="button primary" type="submit">
            Publicar no mural
          </button>
        </form>
      )}

      <Feedback message={message} error={error} />

      <div className="community-tools">
        <label>
          <span>Pesquisar publicações</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Produto, dúvida ou assunto"
          />
        </label>
        <label>
          <span>Ordenar</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="recent">Mais recentes</option>
            <option value="replied">Mais respondidas</option>
          </select>
        </label>
      </div>

      <div className="category-pills" aria-label="Filtrar por categoria">
        <button
          type="button"
          onClick={() => setCategory("")}
          aria-pressed={!category}
        >
          Todas
        </button>
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
          >
            {item.name}
            {item.status === "archived" ? " (arquivada)" : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state" role="status">
          <strong>Carregando conversas…</strong>
        </div>
      ) : topics.length ? (
        <div className="topic-list">
          {topics.map((topic) => (
            <Link href={`/comunidade/${topic.id}`} key={topic.id}>
              <span>
                {topic.category.name}
                {topic.isPinned ? " · Fixado" : ""}
              </span>
              <div>
                <strong>{topic.title}</strong>
                <p>{topic.body}</p>
                <small>
                  {topic.author.displayName}
                  {topic.author.isOfficial
                    ? " · Oficial"
                    : " · Nome informado pelo visitante"}{" "}
                  · {formatDate(topic.createdAt)}
                </small>
              </div>
              <b>{topic.replyCount} respostas</b>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhuma publicação encontrada.</strong>
          <p>Inicie uma conversa útil e contextualizada.</p>
        </div>
      )}
    </section>
  );
}

export function CommunityTopicClient({
  id,
  turnstileSiteKey,
}: CommunityProps & { id: string }) {
  const [topic, setTopic] = useState<PublicWallTopic | null>(null);
  const [replies, setReplies] = useState<PublicWallReply[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(0);
  const [token, setToken] = useState("");
  const [reset, setReset] = useState(0);

  const load = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/community/topics/${id}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Não foi possível carregar a publicação.");
      return;
    }
    setTopic(data.topic ?? null);
    setReplies(data.replies ?? []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!token)
      return setError("Conclua a verificação anti-spam para responder.");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/community/topics/${id}/replies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        body: form.get("body"),
        website: form.get("website"),
        turnstileToken: token,
      }),
    });
    const data = await response.json();
    setToken("");
    setReset((value) => value + 1);
    if (!response.ok)
      return setError(
        data.errors?.join(" ") || data.error || "Não foi possível responder.",
      );
    event.currentTarget.reset();
    setMessage(
      response.status === 202
        ? "Resposta recebida para análise."
        : "Resposta publicada.",
    );
    await load();
  }

  if (error && !topic)
    return (
      <p className="form-message error" role="alert">
        {error}
      </p>
    );
  if (!topic)
    return (
      <div className="empty-state" role="status">
        <strong>Carregando publicação…</strong>
      </div>
    );

  return (
    <section className="topic-detail">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady((value) => value + 1)}
      />
      <Link href="/comunidade">← Voltar ao mural</Link>
      <article className="topic-original">
        <span>
          {topic.category.name}
          {topic.isPinned ? " · Fixado" : ""}
        </span>
        <h1>{topic.title}</h1>
        <p>{topic.body}</p>
        <AuthorLine author={topic.author} createdAt={topic.createdAt} />
        <ReportForm
          targetType="topic"
          targetId={topic.id}
          siteKey={turnstileSiteKey}
          ready={turnstileReady}
          onFeedback={(next) =>
            next.error ? setError(next.error) : setMessage(next.message)
          }
        />
      </article>
      <h2>{replies.length} respostas</h2>
      <div className="replies-list">
        {replies.map((item) => (
          <article key={item.id}>
            <p>{item.body}</p>
            <AuthorLine author={item.author} createdAt={item.createdAt} />
            <ReportForm
              targetType="reply"
              targetId={item.id}
              siteKey={turnstileSiteKey}
              ready={turnstileReady}
              onFeedback={(next) =>
                next.error ? setError(next.error) : setMessage(next.message)
              }
            />
          </article>
        ))}
      </div>
      {topic.isClosed ? (
        <div className="empty-state">
          <strong>Conversa encerrada.</strong>
          <p>Novas respostas não estão disponíveis.</p>
        </div>
      ) : (
        <form className="topic-form" onSubmit={reply}>
          <label>
            Nome que será exibido
            <input name="displayName" minLength={2} maxLength={30} required />
          </label>
          <small>O nome é informado pelo visitante e não é verificado.</small>
          <label>
            Resposta
            <textarea
              name="body"
              minLength={2}
              maxLength={2000}
              rows={5}
              required
            />
          </label>
          <label className="wall-honeypot" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <small>Máximo de um link. Não publique dados pessoais.</small>
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            ready={turnstileReady}
            reset={reset}
            onToken={setToken}
          />
          <button className="button primary">Publicar resposta</button>
        </form>
      )}
      <Feedback message={message} error={error} />
    </section>
  );
}

function ReportForm({
  targetType,
  targetId,
  siteKey,
  ready,
  onFeedback,
}: {
  targetType: "topic" | "reply";
  targetId: string;
  siteKey: string;
  ready: number;
  onFeedback: (value: { message: string; error: string }) => void;
}) {
  const [token, setToken] = useState("");
  const [reset, setReset] = useState(0);
  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token)
      return onFeedback({
        message: "",
        error: "Conclua a verificação anti-spam.",
      });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/community/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        reason: form.get("reason"),
        turnstileToken: token,
        website: form.get("website"),
      }),
    });
    const data = await response.json();
    setToken("");
    setReset((value) => value + 1);
    if (!response.ok)
      return onFeedback({
        message: "",
        error:
          data.errors?.join(" ") || data.error || "Não foi possível denunciar.",
      });
    event.currentTarget.reset();
    onFeedback({ message: "Denúncia registrada para análise.", error: "" });
  }
  return (
    <details className="report-control">
      <summary>Denunciar conteúdo</summary>
      <form onSubmit={report}>
        <label>
          Motivo da denúncia
          <textarea name="reason" minLength={10} maxLength={500} required />
        </label>
        <input
          className="wall-honeypot"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <TurnstileWidget
          siteKey={siteKey}
          ready={ready}
          reset={reset}
          onToken={setToken}
        />
        <button type="submit">Enviar denúncia</button>
      </form>
    </details>
  );
}

function TurnstileWidget({
  siteKey,
  ready,
  reset,
  onToken,
}: {
  siteKey: string;
  ready: number;
  reset: number;
  onToken: (token: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !element.current || !window.turnstile) return;
    const id = window.turnstile.render(element.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
      theme: "dark",
    });
    return () => window.turnstile?.remove(id);
  }, [onToken, ready, reset, siteKey]);
  if (!siteKey)
    return (
      <p className="form-message error">
        Publicação temporariamente indisponível.
      </p>
    );
  return (
    <div
      ref={element}
      className="turnstile-slot"
      aria-label="Verificação anti-spam"
    />
  );
}

function AuthorLine({
  author,
  createdAt,
}: {
  author: PublicWallTopic["author"];
  createdAt: string;
}) {
  return (
    <small>
      {author.displayName} · {author.label} · {formatDate(createdAt)}
    </small>
  );
}

function Feedback({ message, error }: { message: string; error: string }) {
  return (
    <>
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
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
