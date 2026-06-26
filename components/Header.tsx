import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/portfolio"
          className="flex items-center gap-0 font-serif text-xl text-navy"
        >
          <img
            src="/chimp-logo.png"
            alt="PortfolioChimp logo"
            className="-mr-5 h-28 w-auto"
          />
          PortfolioChimp
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link
            href="/portfolio"
            className="rounded-full bg-cta px-4 py-2 text-white shadow-sm transition-colors hover:bg-cta-hover"
          >
            FourteenFish Portfolio Tool
          </Link>
          <a
            href="https://www.maplemed.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gradient-to-b from-neutral-700 via-neutral-900 to-black px-4 py-2 text-white opacity-60 shadow-sm ring-1 ring-white/10 transition-all hover:opacity-100 hover:shadow-lg"
          >
            MapleMedic
          </a>
        </nav>
      </div>
    </header>
  );
}
