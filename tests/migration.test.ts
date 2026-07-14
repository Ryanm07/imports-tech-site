import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

test("migration de privacidade preserva dados e elimina PII das relações", async () => {
  const database = new DatabaseSync(":memory:");
  applyMigration(database, await migration("0000_pink_power_man.sql"));
  const now = "2026-07-14T00:00:00.000Z";
  database.exec(`
    INSERT INTO profiles VALUES ('person@example.com','Pessoa','admin','active',NULL,'${now}','${now}');
    INSERT INTO community_topics VALUES ('topic-1','Smartphones','Título','Corpo','person@example.com','published',0,0,'${now}','${now}',NULL);
    INSERT INTO community_replies VALUES ('reply-1','topic-1','Resposta','person@example.com','published',0,'${now}','${now}',NULL);
    INSERT INTO community_reports VALUES ('report-1','person@example.com','topic','topic-1','Motivo detalhado','open','${now}',NULL);
    INSERT INTO moderation_actions VALUES ('action-1','person@example.com','hide','topic','topic-1','Motivo',NULL,'${now}');
    INSERT INTO content_entries VALUES ('entry-1','setting','site-title','Título','{"key":"site-title","value":"Imports Tech"}','draft',0,'person@example.com','${now}','${now}');
    INSERT INTO rate_limits VALUES ('person@example.com:topic',1,'${now}','${now}');
  `);

  applyMigration(database, await migration("0001_privacy-hardening.sql"));

  const profile = database.prepare("SELECT id,email FROM profiles").get() as {
    id: string;
    email: string;
  };
  assert.match(profile.id, /^p_[a-f0-9]{32}$/);
  assert.equal(profile.email, "person@example.com");
  const topic = database
    .prepare("SELECT author_id FROM community_topics")
    .get() as {
    author_id: string;
  };
  assert.equal(topic.author_id, profile.id);
  const action = database
    .prepare("SELECT actor_id,actor_role FROM moderation_actions")
    .get() as {
    actor_id: string;
    actor_role: string;
  };
  assert.equal(action.actor_id, profile.id);
  assert.equal(action.actor_role, "admin");

  for (const table of [
    "community_topics",
    "community_replies",
    "community_reports",
    "moderation_actions",
    "content_entries",
  ]) {
    const columns = database
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string }>;
    assert.equal(
      columns.some((column) => column.name.includes("email")),
      false,
      table,
    );
  }
  const rateLimitCount = database
    .prepare("SELECT count(*) AS count FROM rate_limits")
    .get() as {
    count: number;
  };
  assert.equal(rateLimitCount.count, 0);
  const foreignKeyErrors = database.prepare("PRAGMA foreign_key_check").all();
  assert.deepEqual(foreignKeyErrors, []);

  assert.throws(() =>
    database.exec(`
      INSERT INTO community_reports VALUES ('report-2','${profile.id}','topic','topic-1','Outro motivo','open','${now}','${now}',NULL,NULL);
    `),
  );
  database.close();
});

async function migration(name: string) {
  return readFile(new URL(`../drizzle/${name}`, import.meta.url), "utf8");
}

function applyMigration(database: DatabaseSync, sql: string) {
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) database.exec(statement);
  }
}
