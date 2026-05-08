import "./globals.css";

export const metadata = {
  title: "Global Gas Price Tracker",
  description: "How many litres does $1 CAD buy around the world?",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Kill any previously installed service worker and clear its caches */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
              regs.forEach(r => r.unregister());
            });
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
