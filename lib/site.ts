export const siteConfig = {
  brandName: "NEOBANK",
  tagline: "Your bank account, rebuilt for the internet.",
  primaryCta: "Create account",
  secondaryCta: "See how it works",
  navItems: [
    { label: "Product", href: "/product" },
    { label: "Security", href: "/security" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Company", href: "/company" }
  ],
  socialLinks: [
    { label: "X", href: "https://x.com/safe" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/safe-ecosystem-foundation/" },
    { label: "GitHub", href: "https://github.com/safe-global" }
  ],
  legalDisclaimer:
    "Not a bank. Banking services provided by regulated partners. Non custodial account ownership remains with the user.",
  complianceNote: "Availability varies by country."
} as const;

export type SiteConfig = typeof siteConfig;
