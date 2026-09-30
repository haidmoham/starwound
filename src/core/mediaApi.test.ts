import assert from "node:assert/strict";
import test from "node:test";
import { bindLocalMedia } from "../media/localMedia.ts";

test("local media API binding loads without playing and releases its object URL once", () => {
  const calls: string[] = [];
  const file = new Blob(["local fixture"]);
  const audio = {
    src: "",
    load() {
      calls.push(`load:${this.src}`);
    },
    pause() {
      calls.push("pause");
    },
    removeAttribute(name: string) {
      assert.equal(name, "src");
      this.src = "";
      calls.push("detach");
    },
  };
  const release = bindLocalMedia(audio, file, {
    createObjectURL(blob) {
      assert.equal(blob, file);
      return "blob:local-test";
    },
    revokeObjectURL(url) {
      calls.push(`revoke:${url}`);
    },
  });
  assert.deepEqual(calls, ["load:blob:local-test"]);
  release();
  release();
  assert.deepEqual(calls, [
    "load:blob:local-test",
    "pause",
    "detach",
    "load:",
    "revoke:blob:local-test",
  ]);
});
