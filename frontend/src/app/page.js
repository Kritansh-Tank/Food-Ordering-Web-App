'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

const API_URL = 'http://localhost:3001';

const roleIcons = {
  admin: '👑',
  manager: '🛡️',
  member: '👤',
};

const countryFlags = {
  India: '🇮🇳',
  America: '🇺🇸',
};

export default function LoginPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(null);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    fetch(`${API_URL}/auth/users`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleLogin = async (userId) => {
    setLoggingIn(userId);
    try {
      await login(userId);
      router.push('/dashboard');
    } catch (err) {
      alert('Login failed: ' + err.message);
    } finally {
      setLoggingIn(null);
    }
  };

  if (user) return null;

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <span className={styles.headerIcon}>🍕</span>
          <h1>FoodOrder</h1>
          <p>Team Food Ordering Application</p>
          <p className={styles.subtitle}>Select your profile to continue</p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className="loading-pulse">Loading users...</div>
          </div>
        ) : (
          <div className={styles.userGrid}>
            {users.map((u) => (
              <button
                key={u.id}
                className={styles.userCard}
                onClick={() => handleLogin(u.id)}
                disabled={loggingIn === u.id}
              >
                <div className={styles.userAvatar}>
                  {roleIcons[u.role]}
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.userNameLogin}>{u.name}</span>
                  <div className={styles.userMeta}>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                    <span className={`badge badge-${u.country.toLowerCase()}`}>
                      {countryFlags[u.country]} {u.country}
                    </span>
                  </div>
                </div>
                {loggingIn === u.id && <span className={styles.spinner}>⏳</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
