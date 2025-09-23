import React, { useState, useEffect } from 'react'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { Check, Sparkles, Gem, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PaymentModal from './PaymentModal'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Plan = () => {
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    if (user && isLoaded) {
      checkSubscriptionStatus()
    }
  }, [user, isLoaded])

  const checkSubscriptionStatus = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setCurrentPlan(data.subscription.plan)
      } else {
        console.error('Subscription status error:', data.message)
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      // Don't show error to user for subscription check, just log it
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '10 AI generations per month',
        'Basic image generation',
        'Article writing (limited)',
        'Community access'
      ],
      buttonText: currentPlan === 'free' ? 'Current Plan' : 'Downgrade to Free',
      isPopular: false,
      planKey: 'free'
    },
    {
      name: 'Premium',
      price: '₹19',
      period: '/month',
      description: 'Best for professionals and creators',
      features: [
        'Unlimited AI generations',
        'Advanced image generation',
        'Premium article writing',
        'Background removal',
        'Object removal',
        'Resume review',
        'Priority support',
        'Early access to new features'
      ],
      buttonText: currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      isPopular: true,
      planKey: 'premium'
    }
  ]

  const handlePlanSelect = async (planKey) => {
    if (!user) {
      openSignIn()
      return
    }

    if (planKey === currentPlan) {
      return // Already on this plan
    }

    if (planKey === 'free') {
      // Handle downgrade to free (if needed)
      handleDowngradeToFree()
      return
    }

    // Handle premium upgrade with Razorpay
    if (planKey === 'premium') {
      await handlePremiumUpgrade()
    }
  }

  const handleDowngradeToFree = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post('/api/subscription/downgrade-free', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setCurrentPlan('free')
        toast.success(data.message)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(data.message || 'Failed to downgrade plan')
      }
    } catch (error) {
      console.error('Downgrade error:', error)
      toast.error('Failed to downgrade plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePremiumUpgrade = async () => {
    if (!user) {
      openSignIn()
      return
    }

    if (currentPlan === 'premium') {
      toast.success('You are already a Premium member!')
      return
    }

    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (paymentData) => {
    setCurrentPlan('premium')
    setShowPaymentModal(false)
    toast.success('Welcome to Premium! Your account has been upgraded. 🎉')
    // Reload to update user data
    setTimeout(() => window.location.reload(), 2000)
  }

  if (!isLoaded || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto z-20 my-20 px-4'>
      <div className='text-center mb-12'>
        <h2 className='text-slate-700 text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4'>Choose Your Plan</h2>
        <p className='text-gray-500 max-w-2xl mx-auto text-sm sm:text-base'>
          Start for free and scale up as you grow. Find the perfect plan for your content creation needs.
        </p>
      </div>

      <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
        {plans.map((plan, index) => (
          <div 
            key={index}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
              plan.isPopular 
                ? 'border-primary bg-gradient-to-br from-primary/5 to-purple-500/5' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                {plan.planKey === 'premium' ? (
                  <Gem className="w-6 h-6 text-primary mr-2" />
                ) : (
                  <Sparkles className="w-6 h-6 text-gray-500 mr-2" />
                )}
                <h3 className="text-xl font-semibold text-slate-700">{plan.name}</h3>
              </div>
              
              <div className="mb-2">
                <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelect(plan.planKey)}
              disabled={loading || plan.planKey === currentPlan}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                plan.planKey === currentPlan
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : plan.isPopular
                  ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                plan.buttonText
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          All plans include our core AI tools. Upgrade anytime for unlimited access.
        </p>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default Plan