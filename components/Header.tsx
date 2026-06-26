import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/portfolio"
          className="flex items-center font-serif text-lg text-navy sm:text-xl"
        >
          <img
            src="/chimp-logo.png"
            alt="PortfolioChimp logo"
            className="-mr-4 h-14 w-auto sm:-mr-5 sm:h-28"
          />
          PortfolioChimp
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-xs font-medium sm:gap-4 sm:text-sm md:gap-6">
          <Link
            href="/portfolio"
            className="whitespace-nowrap rounded-full bg-cta px-3 py-1.5 text-white shadow-sm transition-colors hover:bg-cta-hover sm:px-4 sm:py-2"
          >
            FourteenFish Portfolio Tool
          </Link>
          <a
            href="https://www.maplemed.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full bg-gradient-to-b from-neutral-700 via-neutral-900 to-black px-3 py-1.5 text-white opacity-60 shadow-sm ring-1 ring-white/10 transition-all hover:opacity-100 hover:shadow-lg sm:px-4 sm:py-2"
          >
            MapleMedic
          </a>
        </nav>
      </div>
    </header>
  );
}
