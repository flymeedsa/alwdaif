import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import {
  ObjectAclPolicy,
  ObjectFileLike,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

class LocalObjectFile implements ObjectFileLike {
  constructor(
    public readonly name: string,
    private readonly absolutePath: string,
    private readonly initialContentType = "application/octet-stream",
  ) {}

  private get metadataPath() {
    return `${this.absolutePath}.metadata.json`;
  }

  async exists(): Promise<[boolean]> {
    try {
      await fsPromises.access(this.absolutePath);
      return [true];
    } catch {
      return [false];
    }
  }

  async getMetadata(): Promise<[any]> {
    const stat = await fsPromises.stat(this.absolutePath);
    let stored: any = {};
    try {
      stored = JSON.parse(await fsPromises.readFile(this.metadataPath, "utf8"));
    } catch {}
    return [{
      contentType: stored.contentType || this.initialContentType,
      size: String(stat.size),
      metadata: stored.metadata || {},
    }];
  }

  async setMetadata(update: any): Promise<[any]> {
    const [current] = await this.getMetadata();
    const merged = {
      contentType: update?.contentType || current.contentType,
      metadata: { ...(current.metadata || {}), ...(update?.metadata || {}) },
    };
    await fsPromises.writeFile(this.metadataPath, JSON.stringify(merged), "utf8");
    return [merged];
  }

  createReadStream() {
    return fs.createReadStream(this.absolutePath);
  }

  async save(buffer: Buffer, options?: { metadata?: { contentType?: string } }) {
    await fsPromises.mkdir(path.dirname(this.absolutePath), { recursive: true });
    await fsPromises.writeFile(this.absolutePath, buffer);
    await fsPromises.writeFile(this.metadataPath, JSON.stringify({
      contentType: options?.metadata?.contentType || this.initialContentType,
      metadata: {},
    }), "utf8");
  }
}

type StoredObjectFile = File | LocalObjectFile;

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  private getLocalObjectDir(): string | null {
    return process.env.LOCAL_OBJECT_DIR
      ? path.resolve(process.env.LOCAL_OBJECT_DIR)
      : null;
  }

  private getLocalObjectFile(objectName: string, contentType?: string): LocalObjectFile {
    const root = this.getLocalObjectDir();
    if (!root) throw new Error("LOCAL_OBJECT_DIR is not configured");
    const normalized = objectName.replace(/^[/\\]+/, "").replaceAll("\\", "/");
    const absolutePath = path.resolve(root, normalized);
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
      throw new ObjectNotFoundError();
    }
    return new LocalObjectFile(normalized, absolutePath, contentType);
  }

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<StoredObjectFile | null> {
    if (this.getLocalObjectDir()) {
      const file = this.getLocalObjectFile(filePath);
      const [exists] = await file.exists();
      return exists ? file : null;
    }
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: StoredObjectFile, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(originalFilename = "upload"): Promise<string> {
    if (this.getLocalObjectDir()) {
      const ext = path.extname(originalFilename).toLowerCase().replace(/[^.a-z0-9]/g, "");
      return `/api/uploads/local/${randomUUID()}${ext}`;
    }
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<StoredObjectFile> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    if (this.getLocalObjectDir()) {
      const objectFile = this.getLocalObjectFile(entityId);
      const [exists] = await objectFile.exists();
      if (!exists) throw new ObjectNotFoundError();
      return objectFile;
    }
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (rawPath.startsWith("/api/uploads/local/")) {
      const filename = rawPath.slice("/api/uploads/local/".length).split("?")[0];
      return `/objects/uploads/${filename}`;
    }
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
  
    // Extract the entity ID from the path
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  // Uploads a buffer directly to object storage and returns the object path.
  async uploadBuffer(buffer: Buffer, contentType: string, originalFilename: string): Promise<string> {
    if (this.getLocalObjectDir()) {
      const objectId = randomUUID();
      const ext = path.extname(originalFilename).toLowerCase();
      const filename = `${objectId}${ext}`;
      const file = this.getLocalObjectFile(`uploads/${filename}`, contentType);
      await file.save(buffer, { metadata: { contentType } });
      await setObjectAclPolicy(file, { owner: "admin", visibility: "public" });
      return `/objects/uploads/${filename}`;
    }
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const ext = path.extname(originalFilename).toLowerCase();
    const filename = `${objectId}${ext}`;
    const fullPath = `${privateObjectDir}/uploads/${filename}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(buffer, {
      metadata: { contentType },
      resumable: false,
    });

    await setObjectAclPolicy(file, { owner: "admin", visibility: "public" });

    return `/objects/uploads/${filename}`;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: StoredObjectFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  async saveLocalUpload(filename: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.getLocalObjectDir() || !/^[a-f0-9-]+(?:\.[a-z0-9]+)?$/i.test(filename)) {
      throw new ObjectNotFoundError();
    }
    const file = this.getLocalObjectFile(`uploads/${filename}`, contentType);
    await file.save(buffer, { metadata: { contentType } });
    await setObjectAclPolicy(file, { owner: "admin", visibility: "public" });
    return `/objects/uploads/${filename}`;
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("signed_url" in payload) || typeof payload.signed_url !== "string") {
    throw new Error("Invalid signed object URL response");
  }
  return payload.signed_url;
}
