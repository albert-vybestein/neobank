import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = process.env.NEOBANK_DATA_DIR
  ? path.resolve(process.env.NEOBANK_DATA_DIR)
  : path.join(process.cwd(), ".data");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

function resolvePath(fileName: string) {
  return path.join(dataDir, fileName);
}

export async function readJsonFile<T>(fileName: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = resolvePath(fileName);

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeJsonFile<T>(fileName: string, value: T): Promise<void> {
  await ensureDataDir();
  const filePath = resolvePath(fileName);
  const tempPath = `${filePath}.tmp`;

  await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tempPath, filePath);
}

export async function appendJsonItem<T>(fileName: string, item: T): Promise<void> {
  const current = await readJsonFile<T[]>(fileName, []);
  current.push(item);
  await writeJsonFile(fileName, current);
}
