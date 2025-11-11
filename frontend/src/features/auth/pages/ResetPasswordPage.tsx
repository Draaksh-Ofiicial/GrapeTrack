import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';

// API function for reset password
const resetPasswordApi = {
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
  
  verifyToken: (token: string) =>
    apiClient.post('/auth/verify-reset-token', { token }),
};

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Verify token on mount
  const verifyTokenMutation = useMutation({
    mutationFn: resetPasswordApi.verifyToken,
    onSuccess: () => {
      setIsTokenValid(true);
    },
    onError: () => {
      setIsTokenValid(false);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      resetPasswordApi.resetPassword(data.token, data.newPassword),
    onSuccess: () => {
      setIsResetComplete(true);
    },
  });

  useEffect(() => {
    if (token) {
      verifyTokenMutation.mutate(token);
    } else {
      setIsTokenValid(false);
    }
  }, [token, verifyTokenMutation]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) return;

    resetPasswordMutation.mutate({
      token,
      newPassword: password,
    });
  };

  // Show loading state while verifying token
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-auto flex justify-center">
              <span className="text-3xl font-bold text-indigo-600">GrapeTrack</span>
            </div>
            <div className="mt-6 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-auto flex justify-center">
              <span className="text-3xl font-bold text-indigo-600">GrapeTrack</span>
            </div>
            <div className="mt-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-900">Invalid or expired link</h2>
              <p className="mt-2 text-sm text-gray-600">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <Link
                to="/auth/forgot-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Request new reset link
              </Link>
              <Link
                to="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state after password reset
  if (isResetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-auto flex justify-center">
              <span className="text-3xl font-bold text-indigo-600">GrapeTrack</span>
            </div>
            <div className="mt-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-900">Password reset successful</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <span className="text-3xl font-bold text-indigo-600">GrapeTrack</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                disabled={resetPasswordMutation.isPending}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                disabled={resetPasswordMutation.isPending}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {resetPasswordMutation.error && (
            <div className="text-red-600 text-sm text-center">
              {resetPasswordMutation.error instanceof Error
                ? resetPasswordMutation.error.message
                : 'Failed to reset password. Please try again.'}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || !password || !confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                'Reset password'
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

        {/* Password requirements */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Password requirements:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
              }`}></span>
              At least 8 characters
            </li>
            <li className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                /(?=.*[a-z])(?=.*[A-Z])/.test(password) ? 'bg-green-500' : 'bg-gray-300'
              }`}></span>
              Both uppercase and lowercase letters
            </li>
            <li className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                /(?=.*\d)/.test(password) ? 'bg-green-500' : 'bg-gray-300'
              }`}></span>
              At least one number
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;