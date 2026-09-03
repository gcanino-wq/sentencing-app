import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Federal Sentencing Calculator',
  description:
    'Guideline range estimation from the counts of conviction. An aid for licensed counsel, not a substitute for the Guidelines Manual.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
