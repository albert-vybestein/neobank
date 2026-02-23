import { sepolia } from "viem/chains";

const PASSKEY_STORE_KEY = "neobank_passkeys_v1";
const PASSKEY_PROBE_OWNER = "0x0000000000000000000000000000000000000001";
const MAX_PASSKEY_LABEL_LENGTH = 40;

type PasskeyCoordinates = {
  x: string;
  y: string;
};

type PasskeySigner = {
  rawId: string;
  coordinates: PasskeyCoordinates;
  customVerifierAddress?: string;
  getFn?: (options?: CredentialRequestOptions) => Promise<Credential>;
};

export type PasskeyDeploymentTx = {
  to: string;
  value: string;
  data: string;
};

export type PasskeySummary = {
  ownerAddress: string;
  label: string;
  createdAt: string;
  lastUsedAt: string;
};

type SafePasskeyKit = {
  default: {
    init: (config: unknown) => Promise<{
      getSafeProvider: () => {
        getExternalSigner: () => Promise<{
          createDeployTxRequest?: () => PasskeyDeploymentTx;
        }>;
      };
    }>;
    createPasskeySigner: (credential: Credential) => Promise<PasskeySigner>;
  };
  getPasskeyOwnerAddress: (safe: unknown, passkey: PasskeySigner) => Promise<string>;
};

type StoredPasskeySigner = {
  ownerAddress: string;
  label: string;
  rawId: string;
  coordinates: PasskeyCoordinates;
  customVerifierAddress?: string;
  createdAt: string;
  lastUsedAt: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getSafeRpcUrl() {
  return process.env.NEXT_PUBLIC_SAFE_RPC_URL || sepolia.rpcUrls.default.http[0];
}

async function loadSafePasskeyKit() {
  return (await import("@safe-global/protocol-kit")) as unknown as SafePasskeyKit;
}

function sanitizeLabel(value?: string) {
  const trimmed = (value ?? "").trim().slice(0, MAX_PASSKEY_LABEL_LENGTH);
  return trimmed || "Primary passkey";
}

function defaultPasskeyLabel(ownerAddress: string) {
  return `Passkey ${ownerAddress.slice(2, 6).toUpperCase()}`;
}

function normalizeStoredPasskeys(items: unknown[]): StoredPasskeySigner[] {
  const normalized: StoredPasskeySigner[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const current = item as Partial<StoredPasskeySigner>;
    if (!current.ownerAddress || !current.rawId || !current.coordinates?.x || !current.coordinates?.y) {
      continue;
    }

    const now = new Date().toISOString();
    normalized.push({
      ownerAddress: current.ownerAddress,
      label: sanitizeLabel(current.label ?? defaultPasskeyLabel(current.ownerAddress)),
      rawId: current.rawId,
      coordinates: current.coordinates,
      customVerifierAddress: current.customVerifierAddress,
      createdAt: current.createdAt ?? now,
      lastUsedAt: current.lastUsedAt ?? now
    });
  }

  return normalized;
}

function readStoredPasskeys(): StoredPasskeySigner[] {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(PASSKEY_STORE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = normalizeStoredPasskeys(parsed);
    if (normalized.length !== parsed.length) {
      writeStoredPasskeys(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeStoredPasskeys(items: StoredPasskeySigner[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PASSKEY_STORE_KEY, JSON.stringify(items));
}

function randomBytes(size: number) {
  if (!isBrowser() || !window.crypto?.getRandomValues) {
    throw new Error("Passkeys require a secure browser context.");
  }

  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

function getPasskeyGetFn() {
  return async (options?: CredentialRequestOptions) => {
    if (!navigator.credentials?.get) {
      throw new Error("This browser does not support passkey authentication.");
    }

    const credential = await navigator.credentials.get(options);
    if (!credential) {
      throw new Error("Passkey authentication was not completed.");
    }

    return credential;
  };
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveFallbackOwnerAddress(passkeySigner: PasskeySigner) {
  const payload = `${passkeySigner.rawId}:${passkeySigner.coordinates.x}:${passkeySigner.coordinates.y}`;
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  const addressHex = toHex(new Uint8Array(digest)).slice(0, 40);
  return `0x${addressHex}`;
}

async function derivePasskeyOwnerAddress(passkeySigner: PasskeySigner) {
  const walletMode = process.env.NEXT_PUBLIC_SAFE_WALLET_MODE;
  if (walletMode === "mock") {
    return deriveFallbackOwnerAddress(passkeySigner);
  }

  const rpcUrl = getSafeRpcUrl();
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_SAFE_RPC_URL is required for passkey owner resolution.");
  }

  try {
    const { default: Safe, getPasskeyOwnerAddress } = await loadSafePasskeyKit();
    const probeSafe = await Safe.init({
      provider: rpcUrl,
      predictedSafe: {
        safeAccountConfig: {
          owners: [PASSKEY_PROBE_OWNER],
          threshold: 1
        },
        safeDeploymentConfig: {
          saltNonce: "0"
        }
      }
    });

    return await getPasskeyOwnerAddress(probeSafe, passkeySigner);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not resolve passkey owner address on Sepolia from Safe contracts. ${message}`
    );
  }
}

async function createPasskeyCredential(label?: string) {
  if (!isBrowser()) {
    throw new Error("Passkeys are only available in the browser.");
  }

  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error("This browser does not support passkeys.");
  }

  const hostname = window.location.hostname;
  const rpId = hostname === "localhost" ? "localhost" : hostname;
  const userId = randomBytes(16);
  const challenge = randomBytes(32);
  const passkeyLabel = sanitizeLabel(label);
  const accountAlias = `${passkeyLabel.toLowerCase().replace(/[^a-z0-9]+/g, ".")}.${Date.now().toString().slice(-6)}@neobank.app`;

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: {
        name: "NEOBANK",
        id: rpId
      },
      user: {
        id: userId,
        name: accountAlias,
        displayName: passkeyLabel
      },
      challenge,
      timeout: 60_000,
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 }
      ],
      attestation: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required"
      }
    }
  })) as Credential | null;

  if (!credential) {
    throw new Error("Passkey registration was cancelled.");
  }

  return credential;
}

function upsertStoredPasskey(ownerAddress: string, passkeySigner: PasskeySigner, label?: string) {
  const now = new Date().toISOString();
  const normalizedOwner = ownerAddress.toLowerCase();
  const current = readStoredPasskeys();
  const existing = current.find((item) => item.ownerAddress.toLowerCase() === normalizedOwner);
  const next = current.filter((item) => item.ownerAddress.toLowerCase() !== normalizedOwner);

  next.push({
    ownerAddress,
    label: sanitizeLabel(label ?? existing?.label ?? defaultPasskeyLabel(ownerAddress)),
    rawId: passkeySigner.rawId,
    coordinates: passkeySigner.coordinates,
    customVerifierAddress: passkeySigner.customVerifierAddress,
    createdAt: now,
    lastUsedAt: now
  });

  writeStoredPasskeys(next);
}

function moveStoredPasskeyOwner(fromOwnerAddress: string, toOwnerAddress: string) {
  const fromNormalized = fromOwnerAddress.toLowerCase();
  const toNormalized = toOwnerAddress.toLowerCase();
  if (fromNormalized === toNormalized) return;

  const current = readStoredPasskeys();
  const existing = current.find((item) => item.ownerAddress.toLowerCase() === fromNormalized);
  if (!existing) return;

  const now = new Date().toISOString();
  const next = current.filter(
    (item) => item.ownerAddress.toLowerCase() !== fromNormalized && item.ownerAddress.toLowerCase() !== toNormalized
  );
  next.push({
    ...existing,
    ownerAddress: toOwnerAddress,
    label: sanitizeLabel(existing.label || defaultPasskeyLabel(toOwnerAddress)),
    lastUsedAt: now
  });
  writeStoredPasskeys(next);
}

function markPasskeyUsed(ownerAddress: string) {
  const normalizedOwner = ownerAddress.toLowerCase();
  const current = readStoredPasskeys();
  const next = current.map((item) =>
    item.ownerAddress.toLowerCase() === normalizedOwner
      ? {
          ...item,
          lastUsedAt: new Date().toISOString()
        }
      : item
  );
  writeStoredPasskeys(next);
}

export function listStoredPasskeys(): PasskeySummary[] {
  const all = readStoredPasskeys();
  return [...all]
    .sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
    })
    .map((item) => ({
      ownerAddress: item.ownerAddress,
      label: item.label,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt
    }));
}

export function renameStoredPasskey(ownerAddress: string, label: string) {
  const normalizedOwner = ownerAddress.toLowerCase();
  const current = readStoredPasskeys();
  const next = current.map((item) =>
    item.ownerAddress.toLowerCase() === normalizedOwner
      ? {
          ...item,
          label: sanitizeLabel(label)
        }
      : item
  );
  writeStoredPasskeys(next);
}

export function removeStoredPasskey(ownerAddress: string) {
  const normalizedOwner = ownerAddress.toLowerCase();
  const current = readStoredPasskeys();
  const next = current.filter((item) => item.ownerAddress.toLowerCase() !== normalizedOwner);
  writeStoredPasskeys(next);
}

export function getPasskeySignerForOwner(ownerAddress: string): PasskeySigner | null {
  const normalizedOwner = ownerAddress.toLowerCase();
  const entry = readStoredPasskeys().find((item) => item.ownerAddress.toLowerCase() === normalizedOwner);
  if (!entry) return null;

  markPasskeyUsed(entry.ownerAddress);

  return {
    rawId: entry.rawId,
    coordinates: entry.coordinates,
    customVerifierAddress: entry.customVerifierAddress,
    getFn: getPasskeyGetFn()
  };
}

export async function resolveAndSyncPasskeyOwner(ownerAddress: string) {
  const normalizedOwner = ownerAddress.toLowerCase();
  const entry = readStoredPasskeys().find((item) => item.ownerAddress.toLowerCase() === normalizedOwner);
  if (!entry) {
    throw new Error("Selected passkey is not saved on this device.");
  }

  const signer: PasskeySigner = {
    rawId: entry.rawId,
    coordinates: entry.coordinates,
    customVerifierAddress: entry.customVerifierAddress,
    getFn: getPasskeyGetFn()
  };

  const resolvedOwner = await derivePasskeyOwnerAddress(signer);
  moveStoredPasskeyOwner(entry.ownerAddress, resolvedOwner);
  markPasskeyUsed(resolvedOwner);
  return resolvedOwner;
}

export async function getPasskeyDeploymentTxForOwner(ownerAddress: string): Promise<PasskeyDeploymentTx | null> {
  const passkeySigner = getPasskeySignerForOwner(ownerAddress);
  if (!passkeySigner) return null;

  const { default: Safe } = await loadSafePasskeyKit();
  const rpcUrl = getSafeRpcUrl();
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: {
      ...passkeySigner,
      getFn: passkeySigner.getFn
    },
    predictedSafe: {
      safeAccountConfig: {
        owners: [ownerAddress],
        threshold: 1
      },
      safeDeploymentConfig: {
        saltNonce: "0"
      }
    }
  });

  const externalSigner = (await protocolKit.getSafeProvider().getExternalSigner()) as {
    createDeployTxRequest?: () => PasskeyDeploymentTx;
  };

  if (!externalSigner?.createDeployTxRequest) {
    return null;
  }

  return externalSigner.createDeployTxRequest();
}

export async function registerPasskeySigner(label?: string) {
  const credential = await createPasskeyCredential(label);
  const { default: Safe } = await loadSafePasskeyKit();
  const passkeySigner = (await Safe.createPasskeySigner(credential)) as PasskeySigner;
  const ownerAddress = await derivePasskeyOwnerAddress(passkeySigner);

  upsertStoredPasskey(ownerAddress, passkeySigner, label);

  return {
    ownerAddress,
    passkeySigner: {
      ...passkeySigner,
      getFn: getPasskeyGetFn()
    } as PasskeySigner
  };
}
