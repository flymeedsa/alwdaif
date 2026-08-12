import type { Response } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { ObjectPermission, type ObjectAclPolicy } from "./objectAcl";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

type R2ObjectFile = { key: string; object: R2ObjectBody };

let bucket: R2Bucket | undefined;

export function setObjectStorageBinding(binding: R2Bucket): void {
  bucket = binding;
}

function getBucket(): R2Bucket {
  if (!bucket) throw new Error("R2 object storage binding is not initialized");
  return bucket;
}

function cleanExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "");
}

function keyFromObjectPath(objectPath: string): string {
  if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
  const key = objectPath.slice("/objects/".length).replace(/^\/+/, "");
  if (!key || key.includes("..")) throw new ObjectNotFoundError();
  return key;
}

export class ObjectStorageService {
  async searchPublicObject(filePath: string): Promise<R2ObjectFile | null> {
    const key = filePath.replace(/^\/+/, "");
    const object = await getBucket().get(key);
    return object ? { key, object } : null;
  }

  async downloadObject(file: R2ObjectFile, res: Response, cacheTtlSec = 3600) {
    const bytes = await file.object.arrayBuffer();
    res.set({
      "Content-Type": file.object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": `public, max-age=${cacheTtlSec}`,
    });
    res.send(Buffer.from(bytes));
  }

  async getObjectEntityUploadURL(originalFilename = "upload"): Promise<string> {
    return `/api/uploads/r2/${randomUUID()}${cleanExtension(originalFilename)}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<R2ObjectFile> {
    const key = keyFromObjectPath(objectPath);
    const object = await getBucket().get(key);
    if (!object) throw new ObjectNotFoundError();
    return { key, object };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/api/uploads/r2/")) {
      return `/objects/uploads/${rawPath.slice("/api/uploads/r2/".length).split("?")[0]}`;
    }
    return rawPath;
  }

  async uploadBuffer(buffer: Buffer, contentType: string, originalFilename: string): Promise<string> {
    const key = `uploads/${randomUUID()}${cleanExtension(originalFilename)}`;
    await getBucket().put(key, buffer, { httpMetadata: { contentType } });
    return `/objects/${key}`;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, _aclPolicy: ObjectAclPolicy): Promise<string> {
    return this.normalizeObjectEntityPath(rawPath);
  }

  async canAccessObjectEntity({ requestedPermission }: { userId?: string; objectFile: R2ObjectFile; requestedPermission?: ObjectPermission }): Promise<boolean> {
    return (requestedPermission ?? ObjectPermission.READ) === ObjectPermission.READ;
  }

  async saveR2Upload(filename: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!/^[a-f0-9-]+(?:\.[a-z0-9]+)?$/i.test(filename)) throw new ObjectNotFoundError();
    const key = `uploads/${filename}`;
    await getBucket().put(key, buffer, { httpMetadata: { contentType } });
    return `/objects/${key}`;
  }
}
