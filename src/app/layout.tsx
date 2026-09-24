import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liver Companion — El Puerto de Liverpool",
  description:
    "Plataforma de reclutamiento colaborativo entre HRBP, Reclutamiento (AT), Hiring Manager y clientes internos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E10098",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-surface-canvas text-ink font-sans selection:bg-primary-tint selection:text-primary-dark">
        {children}
      </body>
    </html>
  );
}
