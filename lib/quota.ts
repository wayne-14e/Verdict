/**
 * Free-plan quota (matches the Free tier published on the landing page).
 * Pro accounts (plan === "pro" on the user doc) are unlimited.
 */
export const FREE_SCANS_PER_MONTH = 4;

/** Unix-ms of the first instant of the current month (local time). */
export function monthStartMs(now = Date.now()): number {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
