import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2, CreditCard, Lock } from 'lucide-react';

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51RoKvjJEtC94hWih7VVFI8RzCs8pUt0k0wEKgRA3Orw5nt1nEaVyCFuaQLOc0iFSMINUFWHKSs9Gvstba1qYkWh900I9GlaEWQ');

const PaymentForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setProcessing(true);

    try {
      console.log('Getting auth token...');
      const token = await getToken();
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      // Test server connection first
      console.log('Testing server connection...');
      try {
        const testResponse = await axios.get('/');
        console.log('Server test response:', testResponse.data);
      } catch (testError) {
        console.error('Server connection test failed:', testError);
        toast.error('Cannot connect to server. Please check if server is running.');
        setLoading(false);
        setProcessing(false);
        return;
      }
      
      // Create payment intent
      console.log('Creating payment intent...');
      const { data: intentData } = await axios.post('/api/payment/create-payment-intent', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Payment intent response:', intentData);

      if (!intentData.success) {
        toast.error(intentData.message || 'Failed to create payment');
        console.error('Payment intent failed:', intentData);
        setLoading(false);
        setProcessing(false);
        return;
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.firstName + ' ' + user?.lastName || 'Customer',
              email: user?.emailAddresses[0]?.emailAddress || '',
            },
          },
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
        setLoading(false);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend and upgrade user
        const { data: confirmData } = await axios.post('/api/payment/confirm-payment', {
          payment_intent_id: paymentIntent.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (confirmData.success) {
          toast.success('Payment successful! You are now a Premium member!');
          onSuccess(confirmData);
        } else {
          toast.error(confirmData.message || 'Payment verification failed');
        }
      }

    } catch (error) {
      console.error('Payment error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please sign in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <CreditCard className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Premium Upgrade</h2>
        </div>
        <p className="text-gray-600">₹19/month • Unlimited AI generations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-300 rounded-md p-3">
          <CardElement options={cardStyle} />
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-center text-sm text-blue-800">
            <Lock className="w-4 h-4 mr-2" />
            <span>Test Card: 4242 4242 4242 4242 • Any future date • Any CVC</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!stripe || loading || processing}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Pay ₹19'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>30-day premium access • Cancel anytime</p>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative">
        <Elements stripe={stripePromise}>
          <PaymentForm 
            onSuccess={(data) => {
              onSuccess(data);
              onClose();
            }}
            onCancel={onClose}
          />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentModal;