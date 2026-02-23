import Image from "next/image";
import Link from "next/link";
import { Briefcase, Compass, Eye, Shield, UserCircle2 } from "lucide-react";

import { CompanyContactForm } from "@/components/CompanyContactForm";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const principles = [
  {
    title: "Ownership",
    body: "Users should keep direct control of their account and permissions.",
    icon: UserCircle2
  },
  {
    title: "Usability",
    body: "Powerful infrastructure should feel simple in everyday money moments.",
    icon: Compass
  },
  {
    title: "Safety",
    body: "Policy enforcement and recovery must be clear, auditable, and practical.",
    icon: Shield
  },
  {
    title: "Transparency",
    body: "Fees, limits, and account actions should always be visible before confirmation.",
    icon: Eye
  }
];

const roles = [
  {
    title: "Senior Product Designer",
    location: "London or Remote",
    type: "Full time",
    href: "mailto:careers@neobank.example?subject=Senior%20Product%20Designer"
  },
  {
    title: "Staff Backend Engineer",
    location: "Berlin or Remote",
    type: "Full time",
    href: "mailto:careers@neobank.example?subject=Staff%20Backend%20Engineer"
  },
  {
    title: "Operations Lead",
    location: "New York or Remote",
    type: "Full time",
    href: "mailto:careers@neobank.example?subject=Operations%20Lead"
  }
];

const leadershipTeam = [
  {
    name: "Albert Vybestein",
    role: "CEO",
    image: "/team/ceo.jpg",
    intro:
      "15-time founder across fintech and software. Listed in Forbes 12 Under 12. Harvard graduate in economics and systems design. Leads product vision and global expansion.",
    highlights: ["15x founder", "Forbes 12 Under 12", "Harvard graduate"]
  },
  {
    name: "Alberto Steino",
    role: "CTO",
    image: "/team/cto.jpg",
    intro:
      "Built payment and data systems used by millions across 30+ countries. Known for shipping high-reliability architecture with clean product UX at scale.",
    highlights: ["Scaled systems to 30+ countries", "Built 40+ production releases", "Infrastructure and AI specialist"]
  },
  {
    name: "Albo Vybess",
    role: "COO",
    image: "/team/coo.jpg",
    intro:
      "Operations leader focused on growth and execution. Designed launch playbooks for new markets and built cross-functional teams that keep quality high at speed.",
    highlights: ["Launch playbooks for global markets", "Operator-first execution", "Built teams across product and ops"]
  }
];

export default function CompanyPage() {
  return (
    <>
      <Section className="pb-8 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <Badge variant="outline" className="bg-white text-slate-700">
              Company
            </Badge>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">Building the default account for global money.</h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              We build financial products that combine practical usability with strong ownership controls and transparent operations.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-8">
        <Reveal>
          <div className="space-y-6">
            <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">About</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {principles.map((principle) => (
                <Card key={principle.title} className="card-lift bg-white/95">
                  <CardHeader>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <principle.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-slate-600">{principle.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-white text-slate-700">
                Leadership
              </Badge>
              <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">Our team</h2>
              <p className="text-lg text-slate-600">
                The leadership group combines founder-level speed with production-grade execution across product, engineering, and operations.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {leadershipTeam.map((member) => (
                <Card key={member.name} className="card-lift overflow-hidden bg-white/95">
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                    <Image
                      src={member.image}
                      alt={`${member.name}, ${member.role}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      priority={member.role === "CEO"}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-4">
                      <p className="text-sm font-semibold text-white">{member.role}</p>
                      <p className="text-lg font-semibold text-white">{member.name}</p>
                    </div>
                  </div>
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm leading-relaxed text-slate-700">{member.intro}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.highlights.map((highlight) => (
                        <span
                          key={`${member.name}-${highlight}`}
                          className="rounded-full border border-border/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">Careers</h2>
              <p className="text-lg text-slate-600">
                We hire builders across product, engineering, design, operations.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.title} className="card-lift bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <p className="text-sm text-slate-500">{role.location}</p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-600">{role.type}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={role.href}>View role</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <Card className="bg-white/95">
            <CardHeader className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <CardTitle className="text-4xl md:text-5xl">Contact</CardTitle>
              <p className="text-base text-slate-600">For partnerships and enterprise: sales@neobank.example</p>
            </CardHeader>
            <CardContent>
              <CompanyContactForm />
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
