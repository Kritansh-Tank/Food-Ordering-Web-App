import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const metadata = {
  title: 'FoodOrder — Team Food Ordering App',
  description: 'Order food from your favorite restaurants with role-based access control',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
