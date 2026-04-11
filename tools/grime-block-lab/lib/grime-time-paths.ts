import path from "node:path";

export const GRIME_TIME_REPO_ROOT = path.resolve(process.cwd(), "..", "..");
export const GRIME_TIME_MEDIA_DROP_DIRECTORY = path.join(
  GRIME_TIME_REPO_ROOT,
  ".grimetime-media-drop",
);

