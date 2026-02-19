'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const { user, loading, apiFetch } = useAuth();
  const { addItem, items: cartItems } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [addedItem, setAddedItem] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { router.push('/'); return; }
    if (!user) return;

    Promise.all([
      apiFetch(`/restaurants/${id}`),
      apiFetch(`/restaurants/${id}/menu`),
    ])
      .then(([rest, menu]) => {
        setRestaurant(rest);
        setMenuItems(menu);
      })
      .catch((err) => {
        console.error(err);
        if (err.message === 'Access denied') router.push('/restaurants');
      })
      .finally(() => setFetching(false));
  }, [user, loading, id]);

  const handleAdd = (item) => {
    addItem(item, restaurant);
    setAddedItem(item.id);
    setTimeout(() => setAddedItem(null), 1200);
  };

  const getCartQty = (itemId) => {
    const ci = cartItems.find((i) => i.id === itemId);
    return ci ? ci.quantity : 0;
  };

  if (loading || !user || fetching) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="empty-state loading-pulse">Loading menu...</div>
        </div>
      </>
    );
  }

  if (!restaurant) return null;

  // Group menu items by category
  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const currency = restaurant.country === 'India' ? '₹' : '$';

  return (
    <>
      <Navbar />
      <div className="page-container">
        <button className={styles.backBtn} onClick={() => router.push('/restaurants')}>
          ← Back to restaurants
        </button>

        <div className={styles.restaurantHeader}>
          <div>
            <h1>{restaurant.name}</h1>
            <p className={styles.headerMeta}>
              <span className={styles.cuisineTag}>{restaurant.cuisine}</span>
              <span>⭐ {restaurant.rating}</span>
              <span>🕐 {restaurant.delivery_time}</span>
              <span className={`badge badge-${restaurant.country.toLowerCase()}`}>
                {restaurant.country === 'India' ? '🇮🇳' : '🇺🇸'} {restaurant.country}
              </span>
            </p>
            <p className={styles.desc}>{restaurant.description}</p>
          </div>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            <div className={styles.menuGrid}>
              {items.map((item) => (
                <div key={item.id} className={`card-static ${styles.menuCard}`}>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuNameRow}>
                      <h3>{item.name}</h3>
                      {item.is_vegetarian && <span className={styles.vegBadge}>🟢 Veg</span>}
                    </div>
                    <p className={styles.menuDesc}>{item.description}</p>
                    <span className={styles.price}>{currency}{item.price.toFixed(2)}</span>
                  </div>
                  <div className={styles.menuAction}>
                    {getCartQty(item.id) > 0 && (
                      <span className={styles.cartQty}>{getCartQty(item.id)} in cart</span>
                    )}
                    <button
                      className={`btn btn-primary btn-sm ${addedItem === item.id ? styles.added : ''}`}
                      onClick={() => handleAdd(item)}
                    >
                      {addedItem === item.id ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
