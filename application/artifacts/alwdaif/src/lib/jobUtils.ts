export function isJobClosed(job: { deadlineDate?: Date | string | null; createdAt?: Date | string | null }): boolean {
  const now = new Date();
  if (job.deadlineDate) {
    return new Date(job.deadlineDate) < now;
  }
  if (job.createdAt) {
    const created = new Date(job.createdAt);
    const thirtyDaysLater = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysLater < now;
  }
  return false;
}
