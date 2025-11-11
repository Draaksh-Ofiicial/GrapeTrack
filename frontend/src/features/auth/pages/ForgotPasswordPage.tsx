import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';

// API function for forgot password
const forgotPasswordApi = {
  sendResetEmail: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
};

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordApi.sendResetEmail,
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      forgotPasswordMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <span className="text-3xl font-bold text-indigo-600">GrapeTrack</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          {!isSubmitted ? (
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          ) : (
            <p className="mt-2 text-center text-sm text-green-600">
              Check your email for password reset instructions.
            </p>
          )}
        </div>

        {!isSubmitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={forgotPasswordMutation.isPending}
              />
            </div>

            {forgotPasswordMutation.error && (
              <div className="text-red-600 text-sm text-center">
                {forgotPasswordMutation.error instanceof Error
                  ? forgotPasswordMutation.error.message
                  : 'Failed to send reset email. Please try again.'}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending || !email.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Email sent!</h3>
              <p className="mt-1 text-sm text-gray-500">
                We've sent password reset instructions to{' '}
                <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                  forgotPasswordMutation.reset();
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send to a different email
              </button>
              
              <Link
                to="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;