export type JobSort = "newest" | "popular";
type SortableJob = { createdAt?: Date | string | number | null; viewCount?: number | null };

function timestamp(value: SortableJob["createdAt"]): number {
  if (value == null) return 0;
  const numeric = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const time = new Date(numeric).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function sortJobs<T extends SortableJob>(jobs: readonly T[], order: JobSort): T[] {
  return [...jobs].sort((a, b) => {
    const popularity = order === "popular" ? (b.viewCount ?? 0) - (a.viewCount ?? 0) : 0;
    return popularity || timestamp(b.createdAt) - timestamp(a.createdAt);
  });
}
