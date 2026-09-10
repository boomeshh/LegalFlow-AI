import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'LegalFlow AI — Better Tomorrow',
  description: 'AI-Powered Case & Advocate Workflow Assistant — college prototype',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
