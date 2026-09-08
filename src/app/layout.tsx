import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Single typeface across the whole site.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-mist text-ink-soft">
        {children}
      </body>
    </html>
  );
}
