import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for individuals and small teams getting started',
    features: [
      'Up to 5 team members',
      '50 tasks per month',
      'Basic role management',
      'Email notifications',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$12',
    period: '/user/month',
    description: 'For growing teams that need more power',
    features: [
      'Unlimited team members',
      'Unlimited tasks',
      'Custom roles & permissions',
      'Priority email notifications',
      'Activity logs & analytics',
      'Priority support',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with advanced needs',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'SSO & SAML authentication',
      'Advanced security features',
      'Custom integrations',
      'SLA guarantee',
      '24/7 phone support',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your team's needs. All plans include 14-day free trial.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl ${
                plan.popular
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl scale-105'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.popular ? 'text-indigo-100' : 'text-gray-500'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={plan.popular ? 'text-indigo-100' : 'text-gray-600'}>
                  {plan.description}
                </p>
              </div>
              
              <Link
                to="/auth/register"
                className={`w-full py-4 rounded-lg font-semibold mb-8 transition-all text-center block ${
                  plan.popular
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {plan.cta}
              </Link>
              
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-indigo-200' : 'text-indigo-600'}`} />
                    <span className={plan.popular ? 'text-indigo-50' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
