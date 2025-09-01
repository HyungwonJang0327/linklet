import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalHeader } from "@/components/layout/conditional-header";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { getDictionary } from "@/lib/i18n/dictionary";
import { type Locale, locales } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// export const metadata: Metadata = {
//   title: "Linklet - Your Personal Wishlist Manager",
//   description: "Create, manage, and share your wishlists with ease",
// };

export async function generateMetadata({ params }: { params: Promise<{ locale: 'kr' | 'en' | 'jp' }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
  };
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale: localeParam } = await params;
  // Validate locale
  if (!locales.includes(localeParam as Locale)) {
    notFound();
  }
  
  const locale = localeParam as Locale;

  // Get dictionary for the current locale
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body
        // className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <I18nProvider locale={locale} dictionary={dictionary}>
              <ConditionalHeader />
              {children}
            </I18nProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}