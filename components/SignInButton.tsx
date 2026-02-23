"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useSignIn } from "@/components/SignInProvider";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site";

export function SignInButton({ children, onClick, ...props }: ButtonProps) {
  const { openSignIn } = useSignIn();

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          void trackEvent("sign_in_opened", { location: "cta" });
          openSignIn();
        }
      }}
    >
      {children ?? siteConfig.primaryCta}
    </Button>
  );
}
