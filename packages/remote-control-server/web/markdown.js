import { esc } from "./utils.js";

const FALLBACK_WARNING =
  "[remote-control] Markdown dependencies are unavailable; falling back to plain text rendering.";

const MARKDOWN_WHITE_LIST = {
  a: ["href", "title"],
  blockquote: [],
  br: [],
  code: [],
  del: [],
  em: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  hr: [],
  input: ["checked", "disabled", "type"],
  li: [],
  ol: ["start"],
  p: [],
  pre: [],
  strong: [],
  table: [],
  tbody: [],
  td: ["align"],
  th: ["align"],
  thead: [],
  tr: [],
  ul: [],
};

let warnedAboutFallback = false;
let markedConfigured = false;

function getMarkedApi() {
  const candidate = globalThis.marked;
  if (candidate && typeof candidate.parse === "function") {
    return candidate;
  }
  return null;
}

function getFilterXSS() {
  return typeof globalThis.filterXSS === "function" ? globalThis.filterXSS : null;
}

function configureMarked(markedApi) {
  if (markedConfigured) return;
  markedApi.setOptions({
    async: false,
    breaks: true,
    gfm: true,
  });
  markedConfigured = true;
}

function warnAboutFallback() {
  if (warnedAboutFallback || typeof console === "undefined" || typeof console.warn !== "function") {
    return;
  }
  console.warn(FALLBACK_WARNING);
  warnedAboutFallback = true;
}

function renderPlainTextFallback(content) {
  const escaped = esc(content).replace(/\r\n?/g, "\n");
  return escaped
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function sanitizeMarkdownHtml(html) {
  const filterXSS = getFilterXSS();
  if (!filterXSS) return renderPlainTextFallback(html);

  const sanitized = filterXSS(html, {
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
    whiteList: MARKDOWN_WHITE_LIST,
  });

  return sanitized.replace(/<a\b/g, '<a target="_blank" rel="noopener noreferrer"');
}

export function renderMarkdownHtml(content) {
  if (typeof content !== "string" || !content.trim()) return "";

  const markedApi = getMarkedApi();
  const filterXSS = getFilterXSS();
  if (!markedApi || !filterXSS) {
    warnAboutFallback();
    return renderPlainTextFallback(content);
  }

  configureMarked(markedApi);
  const rawHtml = markedApi.parse(content);
  return sanitizeMarkdownHtml(typeof rawHtml === "string" ? rawHtml : String(rawHtml));
}
