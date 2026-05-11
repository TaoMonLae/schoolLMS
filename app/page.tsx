import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronRight,
  FileText,
  Globe2,
  GraduationCap,
  LibraryBig,
  Palette,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Student Records",
    description: "Learner profiles, guardian details, enrollment history, and support notes in one protected workspace.",
    icon: Users,
    tint: "bg-tint-peach",
    accent: "text-brand-orange"
  },
  {
    title: "Attendance",
    description: "Daily class registers with simple statuses, trends, and export-ready ministry evidence.",
    icon: CalendarCheck,
    tint: "bg-tint-mint",
    accent: "text-brand-green"
  },
  {
    title: "LMS",
    description: "Organize classes, assignments, resources, and teacher workflows without spreadsheet sprawl.",
    icon: GraduationCap,
    tint: "bg-tint-lavender",
    accent: "text-brand-purple"
  },
  {
    title: "E-Library",
    description: "Share reading packs, worksheets, teacher guides, and reusable learning resources.",
    icon: LibraryBig,
    tint: "bg-tint-sky",
    accent: "text-link"
  },
  {
    title: "Video Lessons",
    description: "Support blended classrooms with teacher-created lessons and curated learning videos.",
    icon: PlayCircle,
    tint: "bg-tint-rose",
    accent: "text-brand-pink"
  },
  {
    title: "Reports",
    description: "Generate attendance, enrollment, class, and donor-ready school reports in minutes.",
    icon: BarChart3,
    tint: "bg-tint-yellow",
    accent: "text-brand-brown"
  }
];

const benefits = [
  "Low-cost tools for small NGO schools",
  "Multilingual-ready student and family workflows",
  "Printable reports for ministries, donors, and case teams",
  "Sensitive data controls for vulnerable learner records"
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "Start a small learning centre with core records and registers.",
    features: ["Student directory", "Attendance basics", "Class workspace", "Printable summaries"]
  },
  {
    name: "Plus",
    price: "$29",
    description: "Add richer teaching resources for growing school teams.",
    features: ["E-Library", "Video lessons", "Teacher guides", "Priority imports"]
  },
  {
    name: "Business",
    price: "$79",
    description: "Coordinate multiple programmes with stronger reporting.",
    features: ["Donor reports", "Advanced roles", "School branding", "Audit history"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For NGO networks operating across regions and partners.",
    features: ["Multi-school rollout", "Custom workflows", "Data migration", "Dedicated support"]
  }
];

const faqs = [
  {
    question: "Can we use Refugee SchoolOS without billing?",
    answer: "Yes. This foundation does not connect billing yet, so schools can evaluate the product without payment setup."
  },
  {
    question: "Is it built for multiple schools?",
    answer: "Yes. Core records are designed around school-level tenant scoping so each learning centre can keep its data separate."
  },
  {
    question: "Does it support offline or printable workflows?",
    answer: "The system is designed with printable reports and low-bandwidth school operations in mind."
  },
  {
    question: "Who is it for?",
    answer: "It is built for refugee learning centres, NGO education teams, community schools, and case managers."
  }
];

const navLinks = [
  ["Features", "#features"],
  ["Library", "#library"],
  ["Pricing", "#pricing"],
  ["Request demo", "#demo"]
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <Header />
      <Hero />
      <FeatureSection />
      <BenefitsSection />
      <LibrarySection />
      <BrandingSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-inkDeep">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[-0.01em]">Refugee SchoolOS</span>
        </Link>
        <nav className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-steel md:order-2 md:w-auto">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="order-2 flex items-center gap-2 md:order-3">
          <Link href="/login" className="rounded-md border border-hairlineStrong px-3 py-2 text-sm font-medium hover:bg-surface">
            School Login
          </Link>
          <Link href="#pricing" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-pressed">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy px-4 pb-20 pt-16 text-on-dark sm:px-6 sm:pb-24 lg:px-8">
      <DecorativeField />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-on-dark/18 bg-canvas/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-on-dark/78">
            <Sparkles className="h-3.5 w-3.5 text-brand-yellow" aria-hidden="true" />
            Education continuity for displaced learners
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl lg:text-[80px]">
            Meet the school day workspace.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-on-dark/72">
            Refugee SchoolOS gives NGO schools one calm operating system for student records, attendance, classes, learning materials, videos, and impact reports.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-[18px] py-[10px] text-sm font-medium text-on-primary hover:bg-primary-pressed">
              Get SchoolOS free
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="mailto:hello@refugeeschoolos.org" className="inline-flex items-center justify-center rounded-md border border-on-dark/38 px-[18px] py-[10px] text-sm font-medium text-on-dark hover:bg-canvas/10">
              Request a demo
            </a>
          </div>
        </div>
        <WorkspaceMockup />
      </div>
    </section>
  );
}

function DecorativeField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(86,69,212,0.22),transparent_26%),radial-gradient(circle_at_76%_18%,rgba(255,100,200,0.18),transparent_22%),linear-gradient(180deg,var(--color-brand-navy),var(--color-brand-navy-deep))]" />
      {[
        "left-[8%] top-[18%] bg-brand-pink",
        "left-[18%] top-[65%] bg-brand-yellow",
        "left-[77%] top-[16%] bg-brand-teal",
        "left-[88%] top-[54%] bg-brand-orange",
        "left-[61%] top-[74%] bg-brand-purple"
      ].map((className) => (
        <span key={className} className={`absolute h-4 w-4 rounded-sm opacity-90 shadow-lg ${className}`} />
      ))}
      <div className="absolute left-6 top-32 h-40 w-40 rounded-full border border-on-dark/12" />
      <div className="absolute right-10 top-24 h-36 w-56 rotate-12 rounded-[32px] border border-on-dark/12" />
      <div className="absolute bottom-24 left-1/2 h-px w-[560px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function WorkspaceMockup() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl rounded-lg border border-hairline bg-canvas text-ink shadow-mockup">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-error" />
          <span className="h-3 w-3 rounded-full bg-brand-yellow" />
          <span className="h-3 w-3 rounded-full bg-success" />
          <span className="ml-3 text-xs font-medium text-steel">schoolos.app/dashboard</span>
        </div>
        <div className="hidden items-center gap-2 rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-steel sm:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search learners, classes, reports
        </div>
      </div>
      <div className="grid min-h-[360px] gap-0 overflow-hidden rounded-b-lg lg:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-hairline bg-surfaceSoft p-4 lg:block">
          {['Dashboard', 'Students', 'Classes', 'Attendance', 'Library', 'Reports'].map((item, index) => (
            <div key={item} className={`mb-2 rounded-md px-3 py-2 text-sm font-medium ${index === 0 ? 'bg-brand-navy text-on-dark' : 'text-slate hover:bg-surface'}`}>
              {item}
            </div>
          ))}
        </aside>
        <div className="bg-canvas p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              ["Students", "248", "bg-tint-peach"],
              ["Classes", "18", "bg-tint-mint"],
              ["Attendance", "94%", "bg-tint-lavender"]
            ].map(([label, value, tint]) => (
              <div key={label} className={`rounded-lg border border-hairline p-5 ${tint}`}>
                <p className="text-sm font-medium text-slate">{label}</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-charcoal">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-lg border border-hairline bg-canvas p-5">
              <div className="flex items-center justify-between border-b border-hairlineSoft pb-3">
                <p className="font-semibold text-ink">Today&apos;s register</p>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">Live</span>
              </div>
              {['Primary A', 'Bridge English', 'Math Level 2'].map((item, index) => (
                <div key={item} className="flex items-center justify-between border-b border-hairlineSoft py-4 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item}</p>
                    <p className="text-xs text-steel">{index === 0 ? 'Teacher: Lead Teacher' : `Room ${index + 1}`}</p>
                  </div>
                  <p className="text-sm font-semibold text-link">{index === 1 ? '89%' : '96%'}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-tint-yellowBold p-5 text-charcoal">
              <p className="text-sm font-semibold uppercase tracking-[0.14em]">Impact snapshot</p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">Donor-ready weekly summary</p>
              <div className="mt-5 space-y-3 text-sm">
                {['18 classes reported', '27 support notes updated', '6 new library resources'].map((item) => (
                  <p key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="bg-canvas py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Keep work moving 24/7</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Everything a learning centre needs to run the school day.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className={`${feature.tint} rounded-lg p-8 text-charcoal`}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-canvas/80">
                <feature.icon className={`h-6 w-6 ${feature.accent}`} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg bg-tint-yellowBold p-8 text-charcoal sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">Ask your on-demand assistants</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Practical tools for complex school work.</h2>
          <p className="mt-5 text-base leading-7 text-slate">Purpose-built workflows help administrators, teachers, and case teams coordinate without exposing more student data than each role needs.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div key={benefit} className="rounded-lg border border-hairline bg-canvas p-6">
              <Check className={`h-6 w-6 ${index % 2 === 0 ? 'text-primary' : 'text-brand-green'}`} aria-hidden="true" />
              <p className="mt-4 text-base font-medium leading-7 text-charcoal">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LibrarySection() {
  return (
    <section id="library" className="bg-canvas py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-lg border border-hairline bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Reading Pack", "Beginner English", "bg-tint-sky"],
              ["Video Lesson", "Fractions", "bg-tint-rose"],
              ["Worksheet", "Health & Safety", "bg-tint-mint"],
              ["Teacher Guide", "Bridge Class", "bg-tint-peach"]
            ].map(([type, title, tint]) => (
              <div key={title} className={`rounded-lg border border-hairline bg-canvas p-4 ${tint}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">{type}</p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-charcoal">{title}</p>
                <div className="mt-5 h-2 rounded-full bg-canvas/75">
                  <div className="h-2 w-2/3 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">E-Library and video lessons</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Bring all your school materials together.</h2>
          <p className="mt-5 text-base leading-7 text-slate">
            Build a searchable library of worksheets, reading packs, teacher guides, and video lessons so new teachers and students can keep moving.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink">
              <Globe2 className="h-4 w-4 text-link" aria-hidden="true" />
              Multilingual-ready
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink">
              <FileText className="h-4 w-4 text-brand-orange" aria-hidden="true" />
              Print-friendly
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandingSection() {
  return (
    <section className="bg-surfaceSoft py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Custom school branding</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Make each school feel seen.</h2>
          <p className="mt-5 text-base leading-7 text-slate">
            Configure school names, colors, report headers, and identity details so the platform supports local trust.
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-canvas p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary text-on-primary">
              <Palette className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em] text-ink">Mon Refugee Learning Centre</p>
              <p className="text-sm text-steel">Custom reports, school code, and branded workspace.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <span className="h-12 rounded-md bg-primary" />
            <span className="h-12 rounded-md bg-brand-yellow" />
            <span className="h-12 rounded-md bg-brand-teal" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-canvas py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Pricing</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Start simple, grow when teams are ready.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate">A four-tier comparison mirrors the way NGO programmes expand from a single learning centre to regional networks.</p>
        </div>
        <div id="demo" className="mt-10 grid gap-4 lg:grid-cols-4">
          {pricing.map((plan) => (
            <article key={plan.name} className={`relative rounded-lg p-6 ${plan.featured ? 'border-2 border-primary bg-surface' : 'border border-hairline bg-canvas'}`}>
              {plan.featured ? <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">Popular</span> : null}
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">{plan.name}</h3>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-ink">{plan.price}</p>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate">{plan.description}</p>
              <Link href="/login" className={`mt-5 inline-flex w-full items-center justify-center rounded-md px-[18px] py-[10px] text-sm font-medium ${plan.featured ? 'bg-primary text-on-primary hover:bg-primary-pressed' : 'border border-hairlineStrong text-ink hover:bg-surface'}`}>
                {plan.name === 'Enterprise' ? 'Contact us' : 'Get started'}
              </Link>
              <ul className="mt-5 space-y-3 text-sm text-charcoal">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-md border border-hairline bg-canvas text-sm text-slate">
          {['Student records', 'Attendance exports', 'Library resources', 'Role-based data controls'].map((row) => (
            <div key={row} className="grid grid-cols-[1fr_auto] gap-4 border-b border-hairlineSoft px-5 py-4 last:border-0 sm:grid-cols-5">
              <span className="font-medium text-ink">{row}</span>
              <span className="hidden sm:block">Included</span>
              <span className="hidden sm:block">Expanded</span>
              <span className="hidden sm:block">Advanced</span>
              <span>Custom</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">FAQ</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Questions school teams ask first.</h2>
        <div className="mt-8 divide-y divide-hairline rounded-lg border border-hairline bg-canvas">
          {faqs.map((faq) => (
            <div key={faq.question} className="p-6">
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline bg-navy-deep py-10 text-on-dark">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-5 w-5 text-brand-yellow" aria-hidden="true" />
            Refugee SchoolOS
          </p>
          <p className="mt-2 text-sm text-on-dark/60">hello@refugeeschoolos.org</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-on-dark/64">
          <a href="mailto:hello@refugeeschoolos.org" className="hover:text-on-dark">Contact</a>
          <a href="#" className="hover:text-on-dark">Privacy</a>
          <a href="#" className="hover:text-on-dark">Terms</a>
        </div>
      </div>
    </footer>
  );
}
