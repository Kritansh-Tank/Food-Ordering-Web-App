'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, loading, isAdmin, isManager, isMember, canCheckout, canCancel, canManagePayments } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const cards = [
    {
      title: 'Restaurants',
      description: 'Browse restaurants and explore menus',
      icon: '🍽️',
      href: '/restaurants',
      gradient: 'var(--gradient-1)',
      available: true,
    },
    {
      title: 'My Cart',
      description: 'View and manage items in your cart',
      icon: '🛒',
      href: '/cart',
      gradient: 'var(--gradient-2)',
      available: true,
    },
    {
      title: 'Orders',
      description: canCheckout
        ? 'View orders, checkout & cancel'
        : 'View your order history',
      icon: '📋',
      href: '/orders',
      gradient: 'var(--gradient-3)',
      available: true,
    },
    {
      title: 'Payment Methods',
      description: 'Manage Stripe payment methods',
      icon: '💳',
      href: '/payment-methods',
      gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)',
      available: canManagePayments,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className={styles.welcome}>
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>
            Logged in as <strong>{user.role}</strong> — {user.country}
            {isAdmin && ' • Full access to all features'}
            {isManager && ' • Can manage orders in your country'}
            {isMember && ' • Can browse and create orders'}
          </p>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👤</span>
            <div>
              <div className={styles.statValue}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
              <div className={styles.statLabel}>Your Role</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>{user.country === 'India' ? '🇮🇳' : '🇺🇸'}</span>
            <div>
              <div className={styles.statValue}>{user.country}</div>
              <div className={styles.statLabel}>Region</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>{canCheckout ? '✅' : '❌'}</span>
            <div>
              <div className={styles.statValue}>{canCheckout ? 'Yes' : 'No'}</div>
              <div className={styles.statLabel}>Can Checkout</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>{canManagePayments ? '✅' : '❌'}</span>
            <div>
              <div className={styles.statValue}>{canManagePayments ? 'Yes' : 'No'}</div>
              <div className={styles.statLabel}>Manage Payments</div>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.cardGrid}>
          {cards.map((card) => (
            <button
              key={card.title}
              className={`${styles.actionCard} ${!card.available ? styles.disabled : ''}`}
              onClick={() => card.available && router.push(card.href)}
              disabled={!card.available}
            >
              <div className={styles.actionIcon} style={{ background: card.gradient }}>
                {card.icon}
              </div>
              <div className={styles.actionContent}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                {!card.available && <span className={styles.lockedBadge}>🔒 Admin Only</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
