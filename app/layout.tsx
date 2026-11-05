import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import "./globals.css";

const franklin = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Viabilidad 360° · Evaluación de proyectos",
  description:
    "Plantilla de viabilidad 360° para evaluar cualquier proyecto: VAN, TIR, Monte Carlo, riesgos y dictamen Go / No Go.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="light" className={franklin.variable}>
      <body>{children}</body>
    </html>
  );
}
