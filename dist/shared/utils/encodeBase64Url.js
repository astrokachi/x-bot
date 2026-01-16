export function encodeBase64Url(input) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//, "_")
        .replace(/=/g, "");
}
