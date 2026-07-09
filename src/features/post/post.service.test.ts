import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { XService } from "../../shared/services/x.service.js";
import { publishPost } from "./post.service.js";

test("publishPost without file calls XService.post directly", async () => {
  const mockPost = mock.method(XService.prototype, "post", () =>
    Promise.resolve({
      data: { id: "1", text: "Hello", edit_history_tweet_ids: ["1"] },
    }),
  );
  const mockPostMedia = mock.method(XService.prototype, "postMedia");

  const result = await publishPost("mock-token", "Hello");

  assert.equal(result.data.text, "Hello");
  assert.equal(mockPost.mock.callCount(), 1);
  assert.equal(mockPostMedia.mock.callCount(), 0);

  mock.reset();
});

test("publishPost with file uploads media then posts with media_ids", async () => {
  const mockPost = mock.method(XService.prototype, "post", () =>
    Promise.resolve({
      data: {
        id: "2",
        text: "Hello with image",
        edit_history_tweet_ids: ["2"],
      },
    }),
  );
  const mockPostMedia = mock.method(XService.prototype, "postMedia", () =>
    Promise.resolve("media-123"),
  );

  const file = {
    buffer: Buffer.from("fake-image"),
    mimetype: "image/png",
  } as Express.Multer.File;

  const result = await publishPost("mock-token", "Hello with image", file);

  assert.equal(result.data.text, "Hello with image");
  assert.equal(mockPostMedia.mock.callCount(), 1);
  assert.equal(mockPostMedia.mock.calls[0].arguments[1], "image/png");
  assert.equal(mockPost.mock.callCount(), 1);

  const [, mediaArg] = mockPost.mock.calls[0].arguments as [
    string,
    { media_ids: string[] },
  ];
  assert.deepEqual(mediaArg, { media_ids: ["media-123"] });

  mock.reset();
});
