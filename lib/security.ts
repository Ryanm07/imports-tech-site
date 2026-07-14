export function sanitizePlainText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export function countLinks(value: string) {
  return (value.match(/https?:\/\//gi) || []).length;
}

export function validateCommunityPost(titleValue: unknown, bodyValue: unknown) {
  const title = sanitizePlainText(titleValue, 120);
  const body = sanitizePlainText(bodyValue, 4000);
  const errors: string[] = [];
  if (title.length < 8) errors.push("O título precisa ter pelo menos 8 caracteres.");
  if (body.length < 20) errors.push("Conte um pouco mais para a comunidade conseguir ajudar.");
  if (countLinks(body) > 2) errors.push("Use no máximo dois links por publicação.");
  return { title, body, errors };
}

export function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return new URL(origin).host === new URL(request.url).host;
}
