"use client";

import { ReactNode, createContext, useContext, useMemo, useState } from "react";

import { SignInFlowModal } from "@/components/SignInFlowModal";

type SignInContextValue = {
  openSignIn: () => void;
};

const SignInContext = createContext<SignInContextValue | null>(null);

export function SignInProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      openSignIn: () => setOpen(true)
    }),
    []
  );

  return (
    <SignInContext.Provider value={value}>
      {children}
      <SignInFlowModal open={open} onOpenChange={setOpen} />
    </SignInContext.Provider>
  );
}

export function useSignIn() {
  const context = useContext(SignInContext);
  if (!context) {
    throw new Error("useSignIn must be used inside SignInProvider");
  }
  return context;
}
