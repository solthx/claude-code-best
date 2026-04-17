import { describe, expect, test } from "bun:test";

import "./test-markdown-runtime.js";
import { renderMarkdownHtml } from "./markdown.js";

describe("renderMarkdownHtml", () => {
  test("strips unsafe URLs and unsupported tags", () => {
    const html = renderMarkdownHtml(`[safe](https://example.com) [bad](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">`);

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).not.toContain("<img");
  });

  test("supports task lists and strikethrough", () => {
    const html = renderMarkdownHtml(`- [x] Done\n- [ ] Todo\n\n~~Deprecated~~`);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<input checked disabled");
    expect(html).toContain("<del>Deprecated</del>");
  });

  test("falls back to escaped plain text when markdown globals are unavailable", () => {
    const markedApi = globalThis.marked;
    const filterXSS = globalThis.filterXSS;

    try {
      delete globalThis.marked;
      delete globalThis.filterXSS;

      const html = renderMarkdownHtml(`Line one\nLine two\n\n<script>alert(1)</script>`);

      expect(html).toContain("<p>Line one<br>Line two</p>");
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    } finally {
      globalThis.marked = markedApi;
      globalThis.filterXSS = filterXSS;
    }
  });
});
