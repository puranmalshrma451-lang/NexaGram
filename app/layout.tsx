import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexaGram — Connect. Share. Explore.",
  description: "A social place to connect and share.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}