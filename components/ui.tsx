import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { clsx } from "clsx";

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

const buttonVariants = {
  primary: "bg-primary text-on-primary hover:bg-primary-pressed active:bg-primary-deep",
  secondary: "border border-hairline-strong bg-transparent text-ink hover:bg-surface",
  ghost: "min-h-9 rounded-sm px-sm py-xs text-ink hover:bg-surface",
  dark: "bg-brand-navy text-on-dark hover:bg-brand-navy-mid active:bg-brand-navy-deep",
  "on-dark": "bg-on-dark text-ink hover:bg-surface",
  "secondary-on-dark": "border border-on-dark-muted bg-transparent text-on-dark hover:bg-on-dark/10",
  destructive: "border border-error/45 bg-tint-rose text-error hover:bg-tint-rose/70",
  link: "min-h-0 rounded-none p-0 text-link hover:text-link-pressed"
};

type ButtonProps<T extends ElementType = "button"> = PolymorphicProps<T> & {
  variant?: keyof typeof buttonVariants;
};

export function Button<T extends ElementType = "button">({ as, variant = "primary", className, children, ...props }: ButtonProps<T>) {
  const Component = as ?? "button";
  return (
    <Component
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-[18px] py-[10px] text-sm font-medium leading-[1.3] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted disabled:opacity-100",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

const cardVariants = {
  base: "border-hairline bg-canvas text-ink",
  surface: "border-hairline bg-surface text-ink",
  peach: "border-transparent bg-tint-peach text-charcoal",
  rose: "border-transparent bg-tint-rose text-charcoal",
  mint: "border-transparent bg-tint-mint text-charcoal",
  lavender: "border-transparent bg-tint-lavender text-charcoal",
  sky: "border-transparent bg-tint-sky text-charcoal",
  yellow: "border-transparent bg-tint-yellow text-charcoal",
  "yellow-bold": "border-transparent bg-tint-yellow-bold text-charcoal",
  cream: "border-transparent bg-tint-cream text-charcoal",
  gray: "border-transparent bg-tint-gray text-charcoal",
  navy: "border-brand-navy-mid bg-brand-navy text-on-dark"
};

type CardProps<T extends ElementType = "div"> = PolymorphicProps<T> & {
  variant?: keyof typeof cardVariants;
  padded?: boolean;
};

export function Card<T extends ElementType = "div">({ as, variant = "base", padded = true, className, children, ...props }: CardProps<T>) {
  const Component = as ?? "div";
  return (
    <Component className={clsx("rounded-lg border shadow-card", padded && "p-xl", cardVariants[variant], className)} {...props}>
      {children}
    </Component>
  );
}

export function SectionCard({ className, ...props }: CardProps<"section">) {
  return <Card as="section" className={clsx("shadow-soft", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={clsx("ds-input", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={clsx("ds-input", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={clsx("ds-textarea", className)} {...props} />;
}

const badgeVariants = {
  purple: "bg-primary text-on-primary",
  pink: "bg-brand-pink text-on-primary",
  orange: "bg-brand-orange text-on-primary",
  green: "bg-tint-mint text-brand-green",
  success: "bg-tint-mint text-success",
  warning: "bg-tint-peach text-brand-orange-deep",
  error: "bg-tint-rose text-error",
  neutral: "bg-surface text-slate",
  lavender: "bg-tint-lavender text-brand-purple-800"
};

export function Badge({ variant = "neutral", className, ...props }: ComponentPropsWithoutRef<"span"> & { variant?: keyof typeof badgeVariants }) {
  return <span className={clsx("ds-badge", badgeVariants[variant], className)} {...props} />;
}

export function Tabs({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={clsx("flex flex-wrap gap-xs border-b border-hairline", className)} {...props} />;
}

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return <table className={clsx("ds-table", className)} {...props} />;
}

export function Modal({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={clsx("rounded-lg border border-hairline bg-canvas p-xxl text-ink shadow-mockup", className)} {...props} />;
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg border border-dashed border-hairline-strong bg-surface-soft p-xxl text-center", className)}>
      <h3 className="text-heading-5 text-ink">{title}</h3>
      {description ? <p className="mx-auto mt-xs max-w-xl text-body-sm text-slate">{description}</p> : null}
      {action ? <div className="mt-lg flex justify-center">{action}</div> : null}
    </div>
  );
}

const statTintClasses = {
  peach: "bg-tint-peach",
  rose: "bg-tint-rose",
  mint: "bg-tint-mint",
  lavender: "bg-tint-lavender",
  sky: "bg-tint-sky",
  yellow: "bg-tint-yellow"
};

export function StatCard({ label, value, icon, tint = "lavender" }: { label: string; value: ReactNode; icon?: ReactNode; tint?: keyof typeof statTintClasses }) {
  return (
    <Card as="article" className="shadow-soft">
      <div className="flex items-center justify-between gap-lg">
        <div>
          <p className="text-body-sm font-medium text-slate">{label}</p>
          <p className="mt-xs text-heading-3 text-ink">{value}</p>
        </div>
        {icon ? <div className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink", statTintClasses[tint])}>{icon}</div> : null}
      </div>
    </Card>
  );
}

export function FormField({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="text-body-sm font-semibold text-charcoal">{label}</span>
      <span className="mt-xs block">{children}</span>
      {hint ? <span className="mt-xxs block text-caption text-steel">{hint}</span> : null}
      {error ? <span className="mt-xxs block text-caption font-semibold text-error">{error}</span> : null}
    </label>
  );
}
