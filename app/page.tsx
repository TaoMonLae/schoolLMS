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
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Student Records",
    description: "Keep learner profiles, guardian details, enrollment history, and support notes together.",
    icon: Users
  },
  {
    title: "Attendance",
    description: "Track daily presence by class with simple statuses and export-ready registers.",
    icon: CalendarCheck
  },
  {
    title: "LMS",
    description: "Organize classes, assignments, resources, and school workflows in one calm workspace.",
    icon: GraduationCap
  },
  {
    title: "E-Library",
    description: "Share reading packs, worksheets, and offline-friendly resources across the school.",
    icon: LibraryBig
  },
  {
    title: "Video Lessons",
    description: "Support blended learning with teacher-created lessons and curated learning videos.",
    icon: PlayCircle
  },
  {
    title: "Reports",
    description: "Generate attendance, enrollment, class, and donor-ready school reports without spreadsheets.",
    icon: BarChart3
  }
];

const benefits = [
  "Low-cost tools for small NGO schools",
  "Multilingual-ready student and family workflows",
  "Printable reports for ministries, donors, and case teams",
  "Sensitive data controls for vulnerable learner records"
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

export default function Home() {
  return (
    <main className="min-h-screen bg-rice text-ink">
      <Header />
      <Hero />
      <DashboardPreview />
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-ink/80 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-ink">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">Refugee SchoolOS</span>
        </Link>
        <nav className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/82 md:order-2 md:w-auto">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#library" className="hover:text-white">
            E-Library
          </a>
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <a href="#demo" className="hover:text-white">
            Request Demo
          </a>
        </nav>
        <div className="order-2 flex items-center gap-2 md:order-3">
          <Link href="/login" className="rounded-md border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            School Login
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[720px] items-center overflow-hidden pt-28 sm:min-h-[760px]">
      <Image
        src="/images/refugee-schoolos-hero.png"
        alt="Teacher supporting students in a refugee learning centre classroom"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,33,27,0.92)_0%,rgba(23,33,27,0.78)_40%,rgba(23,33,27,0.26)_100%)]" />
      <div className="mx-auto w-full max-w-7xl px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffd6a5]">Education continuity for displaced learners</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
            School management software for refugee learning centres.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
            Refugee SchoolOS helps NGO schools protect learner records, run classes, track attendance, share lessons, and report impact with dignity.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ffd166] px-5 py-3 text-sm font-bold text-ink hover:bg-[#ffe08f]">
              Start Free
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="#demo" className="inline-flex items-center justify-center rounded-md border border-white/35 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              Request Demo
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-rice">
              School Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">Dashboard preview</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">A calm operating system for busy school teams.</h2>
          <p className="mt-4 text-base leading-7 text-moss">
            Administrators, teachers, and case managers get a shared view of the school without exposing sensitive student data beyond their role.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-rice shadow-soft">
          <div className="flex items-center gap-2 border-b border-line bg-ink px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
            <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
            <span className="h-3 w-3 rounded-full bg-[#6bcb77]" />
            <span className="ml-3 text-xs font-medium text-white/70">schoolos.app/dashboard</span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr]">
            <div className="hidden rounded-md bg-white p-3 sm:block">
              {["Dashboard", "Students", "Classes", "Attendance", "Reports"].map((item) => (
                <div key={item} className="mb-2 rounded-md px-3 py-2 text-xs font-semibold text-moss last:mb-0">
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Students", "248"],
                  ["Classes", "18"],
                  ["Attendance", "94%"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-white p-4">
                    <p className="text-xs font-semibold text-moss">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <p className="text-sm font-semibold text-ink">Today&apos;s register</p>
                  <span className="rounded-md bg-[#e8f3dc] px-2 py-1 text-xs font-semibold text-[#315933]">Live</span>
                </div>
                {["Primary A", "Bridge English", "Math Level 2"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-ink">{item}</p>
                      <p className="text-xs text-moss">{index === 0 ? "Teacher: Lead Teacher" : "Room " + (index + 1)}</p>
                    </div>
                    <p className="text-sm font-semibold text-clay">{index === 1 ? "89%" : "96%"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">Features</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Everything a learning centre needs to run the school day.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <feature.icon className="h-7 w-7 text-clay" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-moss">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-ink py-16 text-white sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#ffd166]">Built for refugee schools</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Practical tools for schools doing complex work with limited resources.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex gap-3 rounded-lg border border-white/15 bg-white/7 p-5">
              <Check className="mt-1 h-5 w-5 shrink-0 text-[#ffd166]" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/84">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LibrarySection() {
  return (
    <section id="library" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-lg border border-line bg-rice p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Reading Pack", "Beginner English"],
              ["Video Lesson", "Fractions"],
              ["Worksheet", "Health & Safety"],
              ["Teacher Guide", "Bridge Class"]
            ].map(([type, title]) => (
              <div key={title} className="rounded-md bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-clay">{type}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
                <div className="mt-4 h-2 rounded-full bg-line">
                  <div className="h-2 w-2/3 rounded-full bg-leaf" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">E-Library and video lessons</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Keep learning materials accessible, organized, and reusable.</h2>
          <p className="mt-4 text-base leading-7 text-moss">
            Build a school library of worksheets, reading packs, teacher guides, and video lessons so new teachers and students can keep moving.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-rice px-3 py-2 text-sm font-semibold text-ink">
              <Globe2 className="h-4 w-4 text-clay" aria-hidden="true" />
              Multilingual-ready
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-rice px-3 py-2 text-sm font-semibold text-ink">
              <FileText className="h-4 w-4 text-clay" aria-hidden="true" />
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
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">Custom school branding</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Make each school feel seen.</h2>
          <p className="mt-4 text-base leading-7 text-moss">
            Configure school names, colours, report headers, and identity details so the platform supports local trust.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#2f6f73] text-white">
              <Palette className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">Mon Refugee Learning Centre</p>
              <p className="text-sm text-moss">Custom reports, school code, and branded workspace.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <span className="h-12 rounded-md bg-[#2f6f73]" />
            <span className="h-12 rounded-md bg-[#ffd166]" />
            <span className="h-12 rounded-md bg-[#b46a45]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">An NGO plan that starts simple.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-moss">
            Start with the school foundation today. Billing is intentionally not connected yet.
          </p>
        </div>
        <div id="demo" className="mt-10 rounded-lg border border-line bg-rice p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">NGO School Plan</p>
              <p className="mt-3 text-4xl font-semibold text-ink">Free to start</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-moss">
                Includes student records, attendance, class management, E-Library foundations, video lesson support, and basic reports.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss">
                Start Free
              </Link>
              <a href="mailto:hello@refugeeschoolos.org" className="inline-flex items-center justify-center rounded-md border border-ink px-5 py-3 text-sm font-bold text-ink hover:bg-white">
                Request Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Questions school teams ask first.</h2>
        <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-white shadow-soft">
          {faqs.map((faq) => (
            <div key={faq.question} className="p-5">
              <h3 className="text-base font-semibold text-ink">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-moss">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-ink py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-base font-semibold">Refugee SchoolOS</p>
          <p className="mt-2 text-sm text-white/68">hello@refugeeschoolos.org</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/72">
          <a href="mailto:hello@refugeeschoolos.org" className="hover:text-white">
            Contact
          </a>
          <a href="#" className="hover:text-white">
            Privacy
          </a>
          <a href="#" className="hover:text-white">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
