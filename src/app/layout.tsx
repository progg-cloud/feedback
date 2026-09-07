import type { Metadata } from "next";
import { Forum, Poppins } from "next/font/google";
import "./globals.css";

// Display face — headings, eyebrows, the wordmark, hero copy.
const forum = Forum({
  variable: "--font-forum",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Text face — body copy, forms, tables, buttons (Forum has only one weight).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RohtreMedia — Client Feedback",
  description: "Tell us how we're doing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${forum.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mist text-ink-soft">
        {children}
      </body>
    </html>
  );
}
