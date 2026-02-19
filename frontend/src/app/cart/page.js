'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function CartPage() {
  const { user, loading, apiFetch, canCheckout, isMember } = useAuth();
  const { items, restaurantId, restaurantName, removeItem, addItem, clearCart, total, itemCount } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleCreateOrder = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const orderData = {
        restaurant_id: restaurantId,
        items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      };
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      clearCart();
      setMessage({ type: 'success', text: 'Order created successfully! View it in Orders.' });
      setTimeout(() => router.push('/orders'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const currency = items.length > 0 && items[0].price > 100 ? '₹' : '$';

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>🛒 Your Cart</h1>
          <p>{itemCount > 0 ? `${itemCount} items from ${restaurantName}` : 'Your cart is empty'}</p>
        </div>

        {message && (
          <div className={`toast toast-${message.type}`} style={{ position: 'relative', marginBottom: 16, bottom: 'auto', right: 'auto' }}>
            {message.text}
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p>Browse restaurants to add items</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/restaurants')}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <div key={item.id} className={`card-static ${styles.cartItem}`}>
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p className={styles.itemPrice}>{currency}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className={styles.qtyControls}>
                    <button className={styles.qtyBtn} onClick={() => removeItem(item.id)}>−</button>
                    <span className={styles.qty}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => addItem(item, { id: restaurantId, name: restaurantName })}>+</button>
                  </div>
                  <div className={styles.itemTotal}>
                    {currency}{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cartSummary}>
              <div className={`card-static ${styles.summaryCard}`}>
                <h2>Order Summary</h2>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{currency}{total.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery Fee</span>
                  <span className={styles.free}>Free</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <span>{currency}{total.toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                  onClick={handleCreateOrder}
                  disabled={submitting}
                >
                  {submitting ? '⏳ Creating Order...' : 'Create Order'}
                </button>

                {isMember && (
                  <p className={styles.memberNote}>
                    ℹ️ As a team member, you can create orders but cannot checkout. A manager or admin will need to checkout your order.
                  </p>
                )}

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
