import { test } from "node:test";
import assert from "node:assert/strict";
import { postSchema } from "./post.validation.js";

test("postSchema validates a valid message", () => {
  const { value, error } = postSchema.validate({ message: "Hello world" });
  assert.equal(error, undefined);
  assert.equal(value.message, "Hello world");
});

test("postSchema rejects empty message", () => {
  const { error } = postSchema.validate({ message: "" });
  assert.notEqual(error, undefined);
});

test("postSchema rejects missing message", () => {
  const { error } = postSchema.validate({});
  assert.notEqual(error, undefined);
});

test("postSchema strips unknown fields when stripUnknown is enabled", () => {
  const { value } = postSchema.validate(
    { message: "test", extra: "should be stripped" },
    { stripUnknown: true },
  );
  assert.equal(value.message, "test");
  assert.equal((value as Record<string, unknown>).extra, undefined);
});
