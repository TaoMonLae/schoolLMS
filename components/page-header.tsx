import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="border-b border-hairline py-xl">
      <p className="text-micro font-semibold uppercase tracking-[0.12em] text-brand-orange">{eyebrow}</p>
      <div className="mt-xs flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading-3 text-ink sm:text-heading-2">{title}</h1>
          <p className="mt-xs max-w-2xl text-body-sm text-slate">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-xs">{actions}</div> : null}
      </div>
    </header>
  );
}
