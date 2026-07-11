import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fynix",
  description: "Tu dinero, tu futuro. Gestor de finanzas personales.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const scriptTema = `
(function(){
  try {
    var sesion = JSON.parse(localStorage.getItem('fynix-sesion') || 'null');
    var raw = null;
    if (sesion && sesion.usuarioId) {
      raw = localStorage.getItem('fynix-data-' + sesion.usuarioId);
    }
    if (!raw) raw = localStorage.getItem('gestor-money-data');
    var d = raw ? JSON.parse(raw) : {};
    var pref = (d.configuracion && d.configuracion.tema) || 'claro';
    if (pref !== 'claro' && pref !== 'oscuro' && pref !== 'sistema') pref = 'claro';
    var visual = pref;
    if (pref === 'sistema') {
      visual = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    }
    document.documentElement.setAttribute('data-theme-preference', pref);
    document.documentElement.setAttribute('data-theme', visual);
    document.documentElement.style.colorScheme = visual === 'oscuro' ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.setAttribute('data-theme-preference', 'claro');
    document.documentElement.setAttribute('data-theme', 'claro');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
