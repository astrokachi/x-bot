import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { XService } from "../../shared/services/x.service.js";
import { publishPost } from "./post.service.js";

test("publishPost without files calls XService.post directly", async () => {
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

test("publishPost with files uploads each then posts with all media_ids", async () => {
  const mockPost = mock.method(XService.prototype, "post", () =>
    Promise.resolve({
      data: {
        id: "2",
        text: "Hello with images",
        edit_history_tweet_ids: ["2"],
      },
    }),
  );
  const mockPostMedia = mock.method(XService.prototype, "postMedia", (_buf: Buffer, mime: string) =>
    Promise.resolve(mime === "image/png" ? "media-1" : "media-2"),
  );

  const files = [
    { buffer: Buffer.from("img1"), mimetype: "image/png" },
    { buffer: Buffer.from("img2"), mimetype: "image/jpeg" },
  ] as Express.Multer.File[];

  const result = await publishPost("mock-token", "Hello with images", files);

  assert.equal(result.data.text, "Hello with images");
  assert.equal(mockPostMedia.mock.callCount(), 2);
  assert.equal(mockPost.mock.callCount(), 1);

  const [, mediaArg] = mockPost.mock.calls[0].arguments as [
    string,
    { media_ids: string[] },
  ];
  assert.deepEqual(mediaArg, { media_ids: ["media-1", "media-2"] });

  mock.reset();
});
