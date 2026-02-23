import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

import { siteConfig } from "@/lib/site";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    title: "Security",
    links: [
      { label: "Security model", href: "/security" }
    ]
  },
  {
    title: "How it works",
    links: [
      { label: "Architecture", href: "/how-it-works" }
    ]
  },
  {
    title: "Pricing",
    links: [
      { label: "Plans", href: "/pricing" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Disclosures", href: "/legal/disclosures" }
    ]
  },
  {
    title: "Contact",
    links: [
      { label: "Company", href: "/company" },
      { label: "sales@neobank.example", href: "mailto:sales@neobank.example" }
    ]
  }
];

const socialIcons = {
  X: Twitter,
  LinkedIn: Linkedin,
  GitHub: Github
};

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,248,252,0.95))] py-16">
      <div className="container space-y-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-600 transition hover:text-slate-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {siteConfig.socialLinks.map((social) => {
            const Icon = socialIcons[social.label as keyof typeof socialIcons] ?? Mail;
            return (
              <Link
                key={social.label}
                href={social.href}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 hover:shadow-soft"
                aria-label={social.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/85 p-5 text-sm leading-relaxed text-slate-600 shadow-soft">
          <p>{siteConfig.legalDisclaimer}</p>
          <p className="mt-2 text-slate-500">{siteConfig.complianceNote}</p>
        </div>
      </div>
    </footer>
  );
}
