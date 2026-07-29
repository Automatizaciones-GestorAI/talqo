import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talqo",
  description: "Aprende idiomas hablando de verdad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
