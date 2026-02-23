"use client";

import dynamic from "next/dynamic";
import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { PrivyProvider, type PrivyProviderProps } from "@privy-io/react-auth";
import { sepolia } from "viem/chains";

import { getPrivyLoginMethodConfig } from "@/lib/privy";

type SignInJourney = "create" | "sign-in";

const SignInFlowModal = dynamic(
  () => import("@/components/SignInFlowModal").then((module) => module.SignInFlowModal),
  { ssr: false }
);

type SignInContextValue = {
  openSignIn: (options?: { journey?: SignInJourney }) => void;
};

const SignInContext = createContext<SignInContextValue | null>(null);

const configuredPrivyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
const privyAppId =
  configuredPrivyAppId && configuredPrivyAppId.length >= 25
    ? configuredPrivyAppId
    : "cm00000000000000000000000";
const privyClientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
const privyLoginMethodConfig = getPrivyLoginMethodConfig();

const privyConfig: PrivyProviderProps["config"] = {
  ...(privyLoginMethodConfig.hasExplicitConfiguration
    ? { loginMethods: privyLoginMethodConfig.methods }
    : {}),
  appearance: {
    theme: "light",
    accentColor: "#0f172a",
    walletChainType: "ethereum-only"
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets"
    }
  },
  supportedChains: [sepolia],
  defaultChain: sepolia
};

function SignInShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [initialJourney, setInitialJourney] = useState<SignInJourney>("create");

  const value = useMemo(
    () => ({
      openSignIn: (options?: { journey?: SignInJourney }) => {
        setInitialJourney(options?.journey ?? "create");
        setModalMounted(true);
        setOpen(true);
      }
    }),
    []
  );

  return (
    <SignInContext.Provider value={value}>
      {children}
      {modalMounted ? <SignInFlowModal open={open} onOpenChange={setOpen} initialJourney={initialJourney} /> : null}
    </SignInContext.Provider>
  );
}

export function SignInProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider appId={privyAppId} clientId={privyClientId} config={privyConfig}>
      <SignInShell>{children}</SignInShell>
    </PrivyProvider>
  );
}

export function useSignIn() {
  const context = useContext(SignInContext);
  if (!context) {
    throw new Error("useSignIn must be used inside SignInProvider");
  }
  return context;
}
