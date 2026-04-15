import type { Punishment } from "@/lib/types";

export default function GhostBadge({
  punishment,
}: {
  punishment: Punishment;
}) {
  if (
    !punishment?.badged ||
    !punishment.badgeExpiresAt ||
    punishment.badgeExpiresAt < Date.now()
  ) {
    return null;
  }
  const daysLeft = Math.max(
    1,
    Math.ceil((punishment.badgeExpiresAt - Date.now()) / (24 * 3600 * 1000))
  );
  return (
    <div className="mt-2 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
      <span>👻</span>
      <span>Ghosted a meeting · {daysLeft}d left</span>
    </div>
  );
}
