import { afterEach, describe, expect, test } from "bun:test";

import { handleConversationCleared, isConversationClearedStatus } from "./render.js";

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

afterEach(() => {
  if (originalDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = originalDocument;
  }
  if (originalWindow === undefined) {
    delete globalThis.window;
    return;
  }
  globalThis.window = originalWindow;
});

describe("status helpers", () => {
  test("detects direct conversation reset markers", () => {
    expect(isConversationClearedStatus({ status: "conversation_cleared" })).toBe(true);
  });

  test("detects nested raw conversation reset markers", () => {
    expect(
      isConversationClearedStatus({
        status: "",
        raw: { status: "conversation_cleared" },
      }),
    ).toBe(true);
  });

  test("ignores unrelated status payloads", () => {
    expect(isConversationClearedStatus({ status: "running" })).toBe(false);
    expect(isConversationClearedStatus({})).toBe(false);
    expect(isConversationClearedStatus(null)).toBe(false);
  });

  test("clears transcript rows but preserves the /clear command row", () => {
    let children = [];
    const makeRow = (text) => ({
      textContent: text,
      cloneNode: () => makeRow(text),
    });
    children = [makeRow("Older assistant message"), makeRow("/clear")];

    const stream = {
      get children() {
        return children;
      },
      set innerHTML(value) {
        if (value === "") {
          children = [];
        }
      },
      appendChild(node) {
        children.push(node);
      },
    };
    const permissionArea = {
      innerHTML: "pending",
      classList: {
        add() {},
      },
    };

    globalThis.document = {
      getElementById(id) {
        if (id === "event-stream") return stream;
        if (id === "permission-area") return permissionArea;
        return null;
      },
    };
    globalThis.window = {};

    handleConversationCleared();

    expect(children.map((row) => row.textContent)).toEqual(["/clear"]);
    expect(permissionArea.innerHTML).toBe("");
  });
});
