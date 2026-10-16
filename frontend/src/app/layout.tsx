import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "100gram — акаунт",
  description: "Вхід, реєстрація та керування безпекою акаунта 100gram.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
