import { AUTO_BACKUP_KEEP, createBackup, getLatestAutoBackup } from "@/lib/backup";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const STARTUP_DELAY_MS = 10 * 1000;

type SchedulerGlobal = typeof globalThis & {
  __autoBackupStarted?: boolean;
};

async function runAutoBackupIfDue() {
  const latest = await getLatestAutoBackup();
  const now = Date.now();

  if (latest) {
    const lastMs = new Date(latest.payloadCreatedAt).getTime();
    if (Number.isFinite(lastMs) && now - lastMs < DAY_MS) {
      return;
    }
  }

  const { written } = await createBackup("auto");
  console.log(
    `[auto-backup] sauvegarde quotidienne creee: ${written.name} (max ${AUTO_BACKUP_KEEP})`,
  );
}

export function startAutoBackupScheduler() {
  if (process.env.AUTO_BACKUP_ENABLED === "false") return;

  const globalRef = globalThis as SchedulerGlobal;
  if (globalRef.__autoBackupStarted) return;
  globalRef.__autoBackupStarted = true;

  const tick = () => {
    runAutoBackupIfDue().catch((error) => {
      console.error("[auto-backup] echec:", error);
    });
  };

  const startupTimer = setTimeout(tick, STARTUP_DELAY_MS);
  const intervalTimer = setInterval(tick, CHECK_INTERVAL_MS);
  startupTimer.unref?.();
  intervalTimer.unref?.();

  console.log(
    `[auto-backup] planificateur demarre (quotidien, max ${AUTO_BACKUP_KEEP} sauvegardes)`,
  );
}
