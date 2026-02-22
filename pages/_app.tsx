import type { AppProps } from 'next/app';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import '../styles/globals.css';
import PinGate from '../components/PinGate';

// ─── Surgena — brand display / H1 (self-hosted, personal use licence) ────────
const surgena = localFont({
  src: '../public/fonts/Surgena.ttf',
  variable: '--font-display',
  display: 'swap',
});

// ─── Inter — all UI text: labels, buttons, descriptions, nav ─────────────────
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

// ─── JetBrains Mono — numeric data, formulas, code labels ────────────────────
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  // inter.variable  — exposes --font-sans for Tailwind font-sans utility
  // inter.className — sets font-family directly on this element so all children inherit Inter
  const fontVars = `${surgena.variable} ${inter.variable} ${inter.className} ${jetbrainsMono.variable}`;

  return (
    <div className={`${fontVars} h-full`}>
      <PinGate>
        <Component {...pageProps} />
      </PinGate>
    </div>
  );
}
