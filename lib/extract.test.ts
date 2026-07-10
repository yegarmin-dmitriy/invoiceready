import { describe, expect, test } from "vitest";
import { mediaPart } from "./extract";

describe("mediaPart", () => {
  test("sends a PDF as an OpenAI file part (mapped to a document by the proxy)", () => {
    const part = mediaPart("application/pdf", "data:application/pdf;base64,AAAA");
    expect(part).toEqual({
      type: "file",
      file: { filename: "invoice.pdf", file_data: "data:application/pdf;base64,AAAA" },
    });
  });

  test("sends an image as an image_url part", () => {
    const part = mediaPart("image/png", "data:image/png;base64,BBBB");
    expect(part).toEqual({ type: "image_url", image_url: { url: "data:image/png;base64,BBBB" } });
  });

  test("treats an unknown type as an image", () => {
    const part = mediaPart("application/octet-stream", "data:application/octet-stream;base64,CCCC");
    expect(part).toMatchObject({ type: "image_url" });
  });
});
