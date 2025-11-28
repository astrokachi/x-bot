export function encodeBase64Url(input: Buffer) {

  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//, "_")
    .replace(/=/g, "");
}