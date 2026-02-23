"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useSignIn } from "@/components/SignInProvider";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site";

type SignInButtonProps = ButtonProps & {
  journey?: "create" | "sign-in";
  eventLocation?: string;
};

export function SignInButton({
  children,
  onClick,
  journey = "create",
  eventLocation = "cta",
  ...props
}: SignInButtonProps) {
  const { openSignIn } = useSignIn();

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          void trackEvent("sign_in_opened", { location: eventLocation, journey });
          openSignIn({ journey });
        }
      }}
    >
      {children ?? siteConfig.primaryCta}
    </Button>
  );
}
