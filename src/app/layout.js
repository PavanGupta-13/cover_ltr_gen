// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'Resume & Cover Letter Generator',
  description: 'Generate tailored resumes and cover letters effortlessly!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
        <h1 className="header-title">Your Personalized Cover Letter Generator</h1>
        </header>
        <main>{children}</main>
        <footer>© {new Date().getFullYear()} Pg Apps</footer>
      </body>
    </html>
  );
}
