import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Ajaia Docs | Industrial Collaborative Workspace',
  description: 'Precision-engineered collaborative rich text workspace with role-based access control, file import, and debounced auto-save.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-[#f4f4f6] antialiased selection:bg-sky-500/30 selection:text-white">
        <UserProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
