/** Cloudways returns the final stored path; signed-storage PUTs may be empty. */
export async function completeUpload(uploadURL: string, file: File, plannedPath: string): Promise<string> {
  const response = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  if (response.headers.get("content-type")?.includes("application/json")) {
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null) throw new Error("Invalid upload response");
    if ("url" in data && typeof data.url === "string") return data.url;
    if ("objectPath" in data && typeof data.objectPath === "string") return data.objectPath;
    throw new Error("Upload response did not include a stored path");
  }
  return plannedPath;
}
