'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Inner form component — must be inside <Elements> provider
function CheckoutForm({ orderId, order, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { apiFetch } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm the order on our backend
      try {
        await apiFetch(`/orders/${orderId}/confirm`, { method: 'POST' });
        onSuccess();
      } catch (err) {
        setError('Payment succeeded but order update failed. Contact support.');
      }
    }

    setProcessing(false);
  };

  const currency = order?.country === 'India' ? '₹' : '$';

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.orderSummary}>
        <h2>Order Summary</h2>
        <div className={styles.restaurantName}>
          {order?.restaurant?.name || 'Restaurant'}
        </div>

        {order?.order_items?.map((item) => (
          <div key={item.id} className={styles.summaryItem}>
            <span>{item.menu_item?.name} × {item.quantity}</span>
            <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}

        <div className={styles.summaryTotal}>
          <span>Total</span>
          <span>{currency}{Number(order?.total || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.stripeSection}>
        <h2>Payment Details</h2>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`btn btn-primary ${styles.payBtn}`}
      >
        {processing ? '⏳ Processing...' : `Pay ${currency}${Number(order?.total || 0).toFixed(2)}`}
      </button>
    </form>
  );
}

// Main page — fetches order, creates PaymentIntent, wraps form in Elements
export default function CheckoutPage() {
  const { user, loading, apiFetch, canCheckout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;

  const [clientSecret, setClientSecret] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/'); return; }
    if (user && !canCheckout) { router.push('/orders'); return; }
    if (!user || !orderId) return;

    const initCheckout = async () => {
      try {
        const data = await apiFetch(`/orders/${orderId}/checkout`, { method: 'POST' });
        setClientSecret(data.clientSecret);
        setOrder(data.order);
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    initCheckout();
  }, [user, loading, orderId]);

  if (loading || !user) return null;

  if (success) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✅</div>
            <h1>Payment Successful!</h1>
            <p>Your order has been placed and is being prepared.</p>
            <button className="btn btn-primary" onClick={() => router.push('/orders')}>
              View Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>💳 Checkout</h1>
          <p>Complete your payment securely with Stripe</p>
        </div>

        {error && (
          <div className={styles.errorBox}>⚠️ {error}</div>
        )}

        {fetching ? (
          <div className="empty-state loading-pulse">Preparing checkout...</div>
        ) : clientSecret ? (
          <div className={styles.checkoutLayout}>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#6366f1',
                    colorBackground: '#ffffff',
                    colorText: '#1e293b',
                    colorDanger: '#ef4444',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '10px',
                    spacingUnit: '4px',
                  },
                },
              }}
            >
              <CheckoutForm
                orderId={orderId}
                order={order}
                onSuccess={() => setSuccess(true)}
              />
            </Elements>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Unable to load checkout</h3>
            <p>{error || 'Something went wrong'}</p>
          </div>
        )}
      </div>
    </>
  );
}
