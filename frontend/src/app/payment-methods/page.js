'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function PaymentMethodsPage() {
  const { user, loading, apiFetch, canManagePayments } = useAuth();
  const [methods, setMethods] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const router = useRouter();

  const fetchMethods = async () => {
    try {
      const data = await apiFetch('/payments/methods');
      setMethods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) { router.push('/'); return; }
    if (user && !canManagePayments) { router.push('/dashboard'); return; }
    if (!user) return;
    fetchMethods();
  }, [user, loading]);

  const handleSetDefault = async (methodId) => {
    setActionLoading(methodId);
    try {
      await apiFetch(`/payments/methods/${methodId}/default`, { method: 'PUT' });
      setMessage({ type: 'success', text: 'Default payment method updated' });
      fetchMethods();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (methodId) => {
    if (!confirm('Remove this payment method?')) return;
    setActionLoading(methodId);
    try {
      await apiFetch(`/payments/methods/${methodId}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Payment method removed' });
      fetchMethods();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return null;

  const brandIcon = (brand) => {
    const icons = { visa: '💳', mastercard: '💳', amex: '💳' };
    return icons[brand] || '💳';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>💳 Payment Methods</h1>
          <p>Manage your Stripe payment methods (Admin only)</p>
        </div>

        {message && (
          <div className={`toast toast-${message.type}`} style={{ position: 'relative', marginBottom: 16, bottom: 'auto', right: 'auto' }}>
            {message.text}
          </div>
        )}

        <div className={styles.infoBox}>
          <p>
            <strong>Note:</strong> Payment methods are managed via Stripe. In a production app, you would use Stripe Elements to securely add cards. 
            For this demo, payment methods can be added through the Stripe API.
          </p>
        </div>

        {fetching ? (
          <div className="empty-state loading-pulse">Loading payment methods...</div>
        ) : methods.length === 0 ? (
          <div className="empty-state">
            <h3>No payment methods</h3>
            <p>No payment methods have been added yet.</p>
          </div>
        ) : (
          <div className={styles.methodsList}>
            {methods.map((method) => (
              <div key={method.id} className={`card-static ${styles.methodCard}`}>
                <div className={styles.methodInfo}>
                  <span className={styles.methodIcon}>{brandIcon(method.card_brand)}</span>
                  <div>
                    <h3>
                      {method.card_brand?.charAt(0).toUpperCase() + method.card_brand?.slice(1)} •••• {method.card_last4}
                    </h3>
                    {method.is_default && (
                      <span className={styles.defaultBadge}>✓ Default</span>
                    )}
                  </div>
                </div>
                <div className={styles.methodActions}>
                  {!method.is_default && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={actionLoading === method.id}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(method.id)}
                    disabled={actionLoading === method.id}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
