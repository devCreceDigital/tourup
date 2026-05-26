export type UploadMime =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export type UploadValidationInput = {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly headerBytes: readonly number[];
};

export type UploadValidationResult = {
  readonly extension: string;
  readonly mime: UploadMime;
  readonly sizeBytes: number;
};

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const maxFileSizeBytes = 10 * 1024 * 1024;

function extensionOf(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  if (index < 0) throw new Error("File extension is required.");
  const extension = normalized.slice(index);
  if (!allowedExtensions.has(extension)) throw new Error("File extension is not allowed.");
  return extension;
}

function startsWith(header: readonly number[], signature: readonly number[]): boolean {
  return signature.every((byte, index) => header[index] === byte);
}

function detectMime(header: readonly number[]): UploadMime {
  if (startsWith(header, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(header, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(header, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (startsWith(header, [0x52, 0x49, 0x46, 0x46]) && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
    return "image/webp";
  }
  throw new Error("File mime type is not allowed.");
}

export function validateUpload(input: UploadValidationInput): UploadValidationResult {
  if (input.sizeBytes < 1) throw new Error("File is empty.");
  if (input.sizeBytes > maxFileSizeBytes) throw new Error("File exceeds the 10MB limit.");
  return {
    extension: extensionOf(input.fileName),
    mime: detectMime(input.headerBytes),
    sizeBytes: input.sizeBytes
  };
}

export function validateUploadUrl(url: string): string {
  const parsed = new URL(url);
  return extensionOf(parsed.pathname);
}
