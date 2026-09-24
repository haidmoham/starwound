import assert from "node:assert/strict";
import test from "node:test";
import { parseYouTubeId } from "./youtube.ts";

test("common video links enter the same portable player", () => {
  const id = "jNQXAC9IVRw";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}&t=4`,
    `https://youtu.be/${id}`,
    `https://m.youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}`,
    `https://youtube.com/embed/${id}`,
  ]) {
    assert.equal(parseYouTubeId(url), id);
  }
});

test("unrelated sites and malformed video ids cannot enter the player", () => {
  for (const url of [
    "https://youtube.com.evil.example/watch?v=jNQXAC9IVRw",
    "javascript:alert(1)",
    "https://youtube.com/watch?v=short",
    "https://example.com/video",
  ]) {
    assert.equal(parseYouTubeId(url), null);
  }
});
