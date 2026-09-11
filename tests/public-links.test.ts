import assert from "node:assert/strict";
import test from "node:test";
import { getPublicLinks } from "../lib/public-links";

test("contato público usa o e-mail de Ryan quando não há configuração", (t) => {
  const previous = process.env.COMMERCIAL_CONTACT_EMAIL;
  delete process.env.COMMERCIAL_CONTACT_EMAIL;
  t.after(() => {
    if (previous === undefined) delete process.env.COMMERCIAL_CONTACT_EMAIL;
    else process.env.COMMERCIAL_CONTACT_EMAIL = previous;
  });

  assert.equal(
    getPublicLinks().commercialEmail,
    "imports.tech.contact@gmail.com",
  );
});

test("contato configurado no painel prevalece sobre o ambiente", (t) => {
  const previous = process.env.COMMERCIAL_CONTACT_EMAIL;
  process.env.COMMERCIAL_CONTACT_EMAIL = "environment@example.com";
  t.after(() => {
    if (previous === undefined) delete process.env.COMMERCIAL_CONTACT_EMAIL;
    else process.env.COMMERCIAL_CONTACT_EMAIL = previous;
  });

  assert.equal(
    getPublicLinks({ commercial_contact_email: " Editorial@Example.com " })
      .commercialEmail,
    "editorial@example.com",
  );
  assert.equal(getPublicLinks().commercialEmail, "environment@example.com");
});

test("contato configurado inválido continua sendo rejeitado", () => {
  assert.equal(
    getPublicLinks({ commercial_contact_email: "javascript:alert(1)" })
      .commercialEmail,
    null,
  );
});
