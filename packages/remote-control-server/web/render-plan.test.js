import { describe, expect, test } from "bun:test";

import "./test-markdown-runtime.js";
import { formatPlanContent } from "./render.js";

describe("formatPlanContent", () => {
  test("renders headings, paragraphs, and lists for plan panels", () => {
    const html = formatPlanContent(`## Summary
Line one
Line two

- First item
- Second item

1. Step one
2. Step two`);

    expect(html).toContain("<h2>Summary</h2>");
    expect(html).toContain("<p>Line one<br>Line two</p>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>First item</li>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Step one</li>");
  });

  test("escapes unsafe markup and preserves inline formatting plus code blocks", () => {
    const html = formatPlanContent(`**Bold** with \`inline\` and <script>alert(1)</script>

\`\`\`js
const markup = "<div>";
\`\`\``);

    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<code>inline</code>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("<pre><code>const markup = &quot;&lt;div&gt;&quot;;");
    expect(html).toContain("</code></pre>");
  });

  test("renders GFM tables and safe links", () => {
    const html = formatPlanContent(`| Name | Value |
| --- | --- |
| Docs | [OpenAI](https://openai.com) |`);

    expect(html).toContain("<table>");
    expect(html).toContain("<th>Name</th>");
    expect(html).toContain("<td><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://openai.com\">OpenAI</a></td>");
  });
});
