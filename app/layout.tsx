import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Linklet - 위시리스트를 만들고 쉽게 공유하세요",
  description: "원하는 상품들을 모아서 위시리스트를 만들고, 친구들과 가족들에게 간단하게 공유할 수 있습니다.",
  keywords: ["위시리스트", "wishlist", "선물", "공유", "링크"],
  authors: [{ name: "Linklet" }],
  creator: "Linklet",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://linklet.vercel.app",
    title: "Linklet - 위시리스트를 만들고 쉽게 공유하세요",
    description: "원하는 상품들을 모아서 위시리스트를 만들고, 친구들과 가족들에게 간단하게 공유할 수 있습니다.",
    siteName: "Linklet",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linklet - 위시리스트를 만들고 쉽게 공유하세요",
    description: "원하는 상품들을 모아서 위시리스트를 만들고, 친구들과 가족들에게 간단하게 공유할 수 있습니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
