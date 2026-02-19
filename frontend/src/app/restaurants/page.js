'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function RestaurantsPage() {
  const { user, loading, apiFetch } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { router.push('/'); return; }
    if (!user) return;
    apiFetch('/restaurants')
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user, loading]);

  if (loading || !user) return null;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>🍽️ Restaurants</h1>
          <p>
            {user.role === 'admin'
              ? 'Showing restaurants from all countries'
              : `Showing restaurants in ${user.country}`}
          </p>
        </div>

        {fetching ? (
          <div className="empty-state loading-pulse">Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div className="empty-state">
            <h3>No restaurants found</h3>
            <p>No restaurants available for your region.</p>
          </div>
        ) : (
          <div className="grid-3">
            {restaurants.map((r, i) => (
              <div
                key={r.id}
                className={`card ${styles.restaurantCard}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => router.push(`/restaurants/${r.id}`)}
              >
                <div className={styles.cardImage}>
                  <span className={styles.cuisineEmoji}>
                    {getCuisineEmoji(r.cuisine)}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h3>{r.name}</h3>
                    <span className={`badge badge-${r.country.toLowerCase()}`}>
                      {r.country === 'India' ? '🇮🇳' : '🇺🇸'} {r.country}
                    </span>
                  </div>
                  <p className={styles.cuisine}>{r.cuisine}</p>
                  <p className={styles.description}>{r.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.rating}>⭐ {r.rating}</span>
                    <span className={styles.delivery}>🕐 {r.delivery_time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function getCuisineEmoji(cuisine) {
  const map = {
    'North Indian': '🍛',
    'South Indian': '🥘',
    'Street Food': '🌮',
    'American': '🍔',
    'Italian-American': '🍕',
    'Mexican': '🌯',
  };
  return map[cuisine] || '🍽️';
}
