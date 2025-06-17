import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Generate llms.txt",
  description: "Generate llms.txt for any website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-secondary-foreground`}
      >
        <div className="w-full bg-red-800/80 py-2 px-4 text-center text-sm text-white font-semibold">
          ⚠️ This API is being deprecated in favor of our main endpoints. Here is an example repo that generates LLMs.txt files:
          <a 
            href="https://github.com/mendableai/create-llmstxt-py"
            className="ml-1 underline hover:text-red-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/mendableai/create-llmstxt-py
          </a>.<br />
          This API endpoint will still remain active but we will no longer be maintaining it after June 30, 2025.
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
