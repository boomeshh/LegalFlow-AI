import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Nav from '../components/Nav';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'LegalFlow AI — Professional Legal Workflow Platform',
  description: 'AI-powered workflow coordination for senior & junior advocates. Responsible legal AI assistance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body>
        <Nav />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}

