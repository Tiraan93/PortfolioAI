import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/portfolio" className="font-serif text-xl text-navy">
          PortfolioAI
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link
            href="/portfolio"
            className="rounded-full bg-cta px-4 py-2 text-white shadow-sm transition-colors hover:bg-cta-hover"
          >
            Portfolio Tool
          </Link>
        </nav>
      </div>
    </header>
  );
}
