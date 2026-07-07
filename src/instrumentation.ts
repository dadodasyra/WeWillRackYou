export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startAutoBackupScheduler } = await import("./lib/auto-backup");
  startAutoBackupScheduler();
}
