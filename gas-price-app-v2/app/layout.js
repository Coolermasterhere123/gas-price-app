import "./globals.css";

export const metadata = {
  title: "Global Gas Price Converter",
  description:
    "How much gasoline can $1 USD buy around the world? Live global comparison.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
