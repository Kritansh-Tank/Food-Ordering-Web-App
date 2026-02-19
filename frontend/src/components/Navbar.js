'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, canManagePayments } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/restaurants', label: 'Restaurants', icon: '🍽️' },
    { href: '/cart', label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`, icon: '🛒' },
    { href: '/orders', label: 'Orders', icon: '📋' },
  ];

  if (canManagePayments) {
    links.push({ href: '/payment-methods', label: 'Payments', icon: '💳' });
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🍕</span>
          <span className={styles.logoText}>FoodOrder</span>
        </Link>

        <div className={styles.navLinks}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            <span className={`badge badge-${user.country.toLowerCase()}`}>{user.country}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
