import { describe, expect, test } from "bun:test";

import "./test-markdown-runtime.js";
import {
  applyStreamingAssistantEvent,
  createStreamingAssistantTextState,
  getStreamingAssistantText,
  splitStreamingAssistantText,
} from "./render.js";

describe("streaming assistant helpers", () => {
  test("reconstructs assistant text from incremental text deltas", () => {
    let state = createStreamingAssistantTextState();

    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "message_start",
        message: { id: "msg_1" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_start",
        index: 0,
        content_block: { type: "thinking" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_start",
        index: 1,
        content_block: { type: "text" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "第一句。" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "第二句" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_start",
        index: 2,
        content_block: { type: "text" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_delta",
        index: 2,
        delta: { type: "text_delta", text: "\n\n第三" },
      },
    });
    state = applyStreamingAssistantEvent(state, {
      event: {
        type: "content_block_delta",
        index: 2,
        delta: { type: "text_delta", text: "句。" },
      },
    });

    expect(getStreamingAssistantText(state)).toBe("第一句。第二句\n\n第三句。");
  });

  test("treats completed sentences and paragraphs as stable segments", () => {
    expect(splitStreamingAssistantText("第一句。第二")).toEqual({
      committedSegments: ["第一句。"],
      liveText: "第二",
    });

    expect(splitStreamingAssistantText("第一段。\n\n第二段。\n\n第三")).toEqual({
      committedSegments: ["第一段。", "\n\n", "第二段。", "\n\n"],
      liveText: "第三",
    });
  });
});
