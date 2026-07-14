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
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const scriptTema = `
(function(){
  try {
    var t = localStorage.getItem('fynix-tema');
    var pref = (t === 'oscuro' || t === 'claro' || t === 'sistema') ? t : 'claro';
    var visual = pref === 'oscuro' ? 'oscuro' : (pref === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
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
