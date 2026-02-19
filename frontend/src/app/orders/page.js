'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function OrdersPage() {
  const { user, loading, apiFetch, canCancel, canCheckout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) { router.push('/'); return; }
    if (!user) return;
    fetchOrders();
  }, [user, loading]);

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(orderId);
    setMessage(null);
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: 'POST' });
      setMessage({ type: 'success', text: 'Order cancelled successfully' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = (orderId) => {
    router.push(`/checkout/${orderId}`);
  };

  if (loading || !user) return null;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>📋 Orders</h1>
          <p>
            {user.role === 'admin'
              ? 'All orders across the organization'
              : user.role === 'manager'
              ? `Orders from ${user.country}`
              : 'Your personal orders'}
          </p>
        </div>

        {message && (
          <div className={`toast toast-${message.type}`} style={{ position: 'relative', marginBottom: 16, bottom: 'auto', right: 'auto' }}>
            {message.text}
          </div>
        )}

        {fetching ? (
          <div className="empty-state loading-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>Create an order from a restaurant to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/restaurants')}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order, i) => (
              <div key={order.id} className={`card-static ${styles.orderCard}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.orderHeader}>
                  <div>
                    <h3>{order.restaurant?.name || 'Restaurant'}</h3>
                    <p className={styles.orderId}>Order #{order.id.slice(0, 8)}</p>
                  </div>
                  <div className={styles.orderHeaderRight}>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                    <span className={`badge badge-${order.country.toLowerCase()}`}>
                      {order.country === 'India' ? '🇮🇳' : '🇺🇸'} {order.country}
                    </span>
                  </div>
                </div>

                {order.order_items && order.order_items.length > 0 && (
                  <div className={styles.orderItems}>
                    {order.order_items.map((item) => (
                      <div key={item.id} className={styles.orderItemRow}>
                        <span>{item.menu_item?.name || 'Item'} × {item.quantity}</span>
                        <span>{order.country === 'India' ? '₹' : '$'}{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    Total: <strong>{order.country === 'India' ? '₹' : '$'}{Number(order.total).toFixed(2)}</strong>
                  </div>
                  <div className={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  <div className={styles.orderActions}>
                    {canCheckout && order.status === 'pending' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleCheckout(order.id)}
                        disabled={actionLoading === order.id}
                      >
                        {actionLoading === order.id ? '⏳' : '💳'} Checkout
                      </button>
                    )}
                    {canCancel && (order.status === 'pending' || order.status === 'placed') && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(order.id)}
                        disabled={actionLoading === order.id}
                      >
                        {actionLoading === order.id ? '⏳' : '✕'} Cancel
                      </button>
                    )}
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
