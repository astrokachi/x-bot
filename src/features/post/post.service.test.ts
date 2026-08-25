import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { XService } from "../../shared/services/x.service.js";
import { publishPost } from "./post.service.js";

test("publishPost without files calls XService.createPost directly", async () => {
  const mockCreatePost = mock.method(XService.prototype, "createPost", () =>
    Promise.resolve({ id: "1", text: "Hello", edit_history_tweet_ids: ["1"] }),
  );
  const mockUploadMedia = mock.method(XService.prototype, "uploadMedia");

  const result = await publishPost("mock-token", "Hello");

  assert.equal(result.text, "Hello");
  assert.equal(mockCreatePost.mock.callCount(), 1);
  assert.equal(mockUploadMedia.mock.callCount(), 0);

  mock.reset();
});

test("publishPost with files uploads each then posts with all media_ids", async () => {
  const mockCreatePost = mock.method(XService.prototype, "createPost", () =>
    Promise.resolve({
      id: "2",
      text: "Hello with images",
      edit_history_tweet_ids: ["2"],
    }),
  );
  const mockUploadMedia = mock.method(XService.prototype, "uploadMedia", (_buf: Buffer, mime: string) =>
    Promise.resolve(mime === "image/png" ? "media-1" : "media-2"),
  );

  const files = [
    { buffer: Buffer.from("img1"), mimetype: "image/png" },
    { buffer: Buffer.from("img2"), mimetype: "image/jpeg" },
  ] as Express.Multer.File[];

  const result = await publishPost("mock-token", "Hello with images", files);

  assert.equal(result.text, "Hello with images");
  assert.equal(mockUploadMedia.mock.callCount(), 2);
  assert.equal(mockCreatePost.mock.callCount(), 1);

  const [, , mediaIdsArg] = mockCreatePost.mock.calls[0].arguments as [
    string,
    string | undefined,
    string[],
  ];
  assert.deepEqual(mediaIdsArg, ["media-1", "media-2"]);

  mock.reset();
});
