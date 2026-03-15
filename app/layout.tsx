import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoEmail — Campaign Manager",
  description: "Multi-sender email campaign tool with smart scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}