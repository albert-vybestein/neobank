import { PrivyClient } from "@privy-io/node";

type PrivyLinkedAccount = {
  type?: string;
  address?: string;
  chain_type?: string;
};

let cachedPrivyClient: PrivyClient | null = null;

function getPrivyEnv() {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Privy server is not configured. Set PRIVY_APP_ID and PRIVY_APP_SECRET.");
  }

  return {
    appId,
    appSecret,
    jwtVerificationKey: process.env.PRIVY_VERIFICATION_KEY
  };
}

function getPrivyClient() {
  if (cachedPrivyClient) return cachedPrivyClient;
  const env = getPrivyEnv();
  cachedPrivyClient = new PrivyClient({
    appId: env.appId,
    appSecret: env.appSecret,
    jwtVerificationKey: env.jwtVerificationKey
  });
  return cachedPrivyClient;
}

function hasWalletLinked(accounts: PrivyLinkedAccount[], walletAddress: string) {
  const normalizedWallet = walletAddress.toLowerCase();
  return accounts.some((account) => {
    if (!account || typeof account !== "object") return false;
    if (!account.address || typeof account.address !== "string") return false;
    if (account.address.toLowerCase() !== normalizedWallet) return false;
    if (account.type !== "wallet" && account.type !== "smart_wallet") return false;
    if (account.type === "wallet" && account.chain_type && account.chain_type !== "ethereum") return false;
    return true;
  });
}

export async function verifyPrivyAccessTokenForWallet(params: {
  accessToken: string;
  walletAddress: string;
}) {
  const client = getPrivyClient();
  const token = await client.utils().auth().verifyAccessToken(params.accessToken);
  const user = await client.users()._get(token.user_id);

  const linkedAccounts = (user.linked_accounts ?? []) as PrivyLinkedAccount[];
  if (!hasWalletLinked(linkedAccounts, params.walletAddress)) {
    throw new Error("Authenticated Privy user does not have this wallet linked.");
  }

  return {
    userId: token.user_id
  };
}
