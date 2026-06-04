import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCA Portfolio AI — GP Training Case Reviews",
  description:
    "Generate structured GP portfolio case reviews for SCA and RCGP training. Describe your case and get capabilities, learning needs, and reflection in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <footer className="border-t border-border bg-card/80 px-4 py-6">
          <div className="mx-auto max-w-6xl text-center text-xs text-muted sm:px-6">
            AI generated drafts must be reviewed before portfolio submission. Not
            medical advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
