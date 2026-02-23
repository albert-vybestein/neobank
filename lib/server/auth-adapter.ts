import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import Safe, { hashSafeMessage } from "@safe-global/protocol-kit";
import { verifyMessage, type Hex } from "viem";

import { readJsonFile, writeJsonFile } from "@/lib/server/json-store";
import { getValidatedSafeRpcUrl, isMockDeployMode, isWalletOwnerOfSafe } from "@/lib/server/safe-adapter";

export const SESSION_COOKIE_NAME = "neobank_session";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const WALLET_SIGNATURE_REGEX = /^0x[a-fA-F0-9]{130}$/;

type AuthChallengeRecord = {
  nonce: Hex;
  walletAddress: string;
  safeAddress: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
};

type AuthSessionRecord = {
  tokenHash: string;
  token?: string;
  walletAddress: string;
  safeAddress: string;
  createdAt: string;
  expiresAt: string;
};

type CreatedAuthSession = {
  token: string;
  tokenHash: string;
  walletAddress: string;
  safeAddress: string;
  createdAt: string;
  expiresAt: string;
};

function nowMs() {
  return Date.now();
}

function isExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= nowMs();
}

function createNonce(): Hex {
  return `0x${randomBytes(32).toString("hex")}`;
}

function createToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatchesSession(session: AuthSessionRecord, token: string) {
  if (session.tokenHash) {
    const tokenHash = hashToken(token);
    const sessionHash = session.tokenHash;
    if (tokenHash.length !== sessionHash.length) return false;
    return timingSafeEqual(Buffer.from(tokenHash), Buffer.from(sessionHash));
  }

  if (!session.token) return false;
  if (session.token.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(session.token), Buffer.from(token));
}

async function verifySafeAccountSignature(params: {
  safeAddress: string;
  walletAddress: string;
  message: string;
  signature: string;
}) {
  const rpcUrl = await getValidatedSafeRpcUrl();
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    safeAddress: params.safeAddress
  });

  const rawMessageHash = hashSafeMessage(params.message);
  const safeMessageHash = await protocolKit.getSafeMessageHash(rawMessageHash);

  // Safe docs and deployed versions differ in how the hash is passed to isValidSignature.
  // We validate both variants and accept either one.
  const [rawHashValid, safeHashValid] = await Promise.all([
    protocolKit.isValidSignature(rawMessageHash, params.signature),
    protocolKit.isValidSignature(safeMessageHash, params.signature)
  ]);

  if (rawHashValid || safeHashValid) return true;

  const owners = await protocolKit.getOwners();
  const walletIsOwner = owners.some((owner) => owner.toLowerCase() === params.walletAddress.toLowerCase());
  if (!walletIsOwner) {
    throw new Error("Passkey owner address is not an owner on this Safe account.");
  }

  const passkeySignerCode = await protocolKit.getSafeProvider().getContractCode(params.walletAddress);
  if (!passkeySignerCode || passkeySignerCode === "0x") {
    throw new Error(
      `Passkey signer contract ${params.walletAddress} is not deployed on Sepolia. Redeploy the account with passkey setup, or fund relayer and deploy signer first.`
    );
  }

  throw new Error(
    "Passkey signature could not be validated. Make sure you approve with the same passkey used to create this account."
  );
}

export function formatAuthMessage(params: { safeAddress: string; walletAddress: string; nonce: string; issuedAt: string }) {
  return [
    "NEOBANK account login",
    `Safe: ${params.safeAddress}`,
    `Wallet: ${params.walletAddress}`,
    `Nonce: ${params.nonce}`,
    `Issued at: ${params.issuedAt}`
  ].join("\n");
}

async function getChallenges() {
  return readJsonFile<AuthChallengeRecord[]>("auth-challenges.json", []);
}

async function getSessions() {
  return readJsonFile<AuthSessionRecord[]>("auth-sessions.json", []);
}

async function createAuthSession(params: {
  walletAddress: string;
  safeAddress: string;
}): Promise<CreatedAuthSession> {
  const token = createToken();
  const sessionRecord: AuthSessionRecord = {
    tokenHash: hashToken(token),
    walletAddress: params.walletAddress,
    safeAddress: params.safeAddress,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(nowMs() + SESSION_TTL_MS).toISOString()
  };

  const sessions = (await getSessions()).filter((entry) => !isExpired(entry.expiresAt));
  sessions.push(sessionRecord);
  await writeJsonFile("auth-sessions.json", sessions);

  return {
    ...sessionRecord,
    token
  };
}

export async function createAuthSessionForOwner(params: { walletAddress: string; safeAddress: string }) {
  const owner = await isWalletOwnerOfSafe(params.walletAddress, params.safeAddress);
  if (!owner) {
    throw new Error("Connected wallet is not an owner of this Safe account");
  }

  return createAuthSession(params);
}

export async function createAuthChallenge(params: { walletAddress: string; safeAddress: string }) {
  const owner = await isWalletOwnerOfSafe(params.walletAddress, params.safeAddress);
  if (!owner) {
    throw new Error("Connected wallet is not an owner of this Safe account");
  }

  const createdAt = new Date().toISOString();
  const nonce = createNonce();
  const message = formatAuthMessage({
    safeAddress: params.safeAddress,
    walletAddress: params.walletAddress,
    nonce,
    issuedAt: createdAt
  });

  const challenge: AuthChallengeRecord = {
    nonce,
    walletAddress: params.walletAddress,
    safeAddress: params.safeAddress,
    message,
    createdAt,
    expiresAt: new Date(nowMs() + CHALLENGE_TTL_MS).toISOString(),
    used: false
  };

  const current = (await getChallenges()).filter((entry) => !isExpired(entry.expiresAt));
  current.push(challenge);
  await writeJsonFile("auth-challenges.json", current);

  return {
    nonce,
    message,
    expiresAt: challenge.expiresAt
  };
}

export async function verifyAuthChallenge(params: {
  walletAddress: string;
  safeAddress: string;
  nonce: string;
  signature: string;
  authMethod?: "wallet" | "passkey";
}) {
  const challenges = await getChallenges();
  const challenge = challenges.find(
    (entry) =>
      entry.nonce.toLowerCase() === params.nonce.toLowerCase() &&
      entry.walletAddress.toLowerCase() === params.walletAddress.toLowerCase() &&
      entry.safeAddress.toLowerCase() === params.safeAddress.toLowerCase() &&
      !entry.used
  );

  if (!challenge || isExpired(challenge.expiresAt)) {
    throw new Error("Login challenge expired. Start sign in again.");
  }

  if (!isMockDeployMode()) {
    const authMethod = params.authMethod ?? "wallet";
    if (authMethod === "passkey") {
      await verifySafeAccountSignature({
        safeAddress: params.safeAddress,
        walletAddress: params.walletAddress,
        message: challenge.message,
        signature: params.signature
      });
    } else {
      if (!WALLET_SIGNATURE_REGEX.test(params.signature)) {
        throw new Error("Invalid wallet signature format");
      }

      const validSignature = await verifyMessage({
        address: params.walletAddress as Hex,
        message: challenge.message,
        signature: params.signature as Hex
      });

      if (!validSignature) {
        throw new Error("Signature verification failed");
      }
    }
  }

  const owner = await isWalletOwnerOfSafe(params.walletAddress, params.safeAddress);
  if (!owner) {
    throw new Error("Wallet is no longer an owner of this Safe account");
  }

  const updatedChallenges = challenges.map((entry) =>
    entry.nonce === challenge.nonce ? { ...entry, used: true } : entry
  );
  await writeJsonFile("auth-challenges.json", updatedChallenges);

  return createAuthSession({
    walletAddress: params.walletAddress,
    safeAddress: params.safeAddress
  });
}

export async function createMockAuthSession(params: { walletAddress: string; safeAddress: string }) {
  return createAuthSessionForOwner(params);
}

export async function getAuthSessionByToken(token: string) {
  if (!token) return null;
  const sessions = await getSessions();
  const validSessions = sessions.filter((entry) => !isExpired(entry.expiresAt));
  if (validSessions.length !== sessions.length) {
    await writeJsonFile("auth-sessions.json", validSessions);
  }

  const session = validSessions.find((entry) => tokenMatchesSession(entry, token));
  if (!session) return null;
  if (!session.tokenHash) {
    const migratedSessions = validSessions.map((entry) =>
      entry === session ? { ...entry, tokenHash: hashToken(token), token: undefined } : entry
    );
    await writeJsonFile("auth-sessions.json", migratedSessions);
  }

  return session;
}

export async function revokeAuthSession(token: string) {
  const sessions = await getSessions();
  const next = sessions.filter((entry) => !tokenMatchesSession(entry, token));
  await writeJsonFile("auth-sessions.json", next);
}
