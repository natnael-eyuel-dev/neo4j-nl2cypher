import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Neo4j Natural Language Query System',
  description: 'Query graph databases in natural language using LLM integration and interactive visualizations',
  keywords: ['neo4j', 'natural language', 'llm', 'graph database', 'cypher', 'visualization'],
  authors: [{ name: 'Your Name' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Neo4j Natural Language Query System',
    description: 'Query graph databases in natural language using LLM integration',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neo4j Natural Language Query System',
    description: 'Query graph databases in natural language using LLM integration',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A73E8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#34A853',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#DC2626',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
