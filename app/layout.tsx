import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Laser Elimination Battle Royale',
  description: '2D Physics simulation of dynamic laser string elimination battle royale with bouncing balls and neon visual effects.',
  openGraph: {
    title: 'Laser Elimination Battle Royale',
    description: '2D Physics simulation of dynamic laser string elimination battle royale with bouncing balls and neon visual effects.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laser Elimination Battle Royale',
    description: '2D Physics simulation of dynamic laser string elimination battle royale with bouncing balls and neon visual effects.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
