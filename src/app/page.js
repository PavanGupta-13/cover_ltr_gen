'use client';

import './globals.css'
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InputForm from './components/InputForm';
import Signup from './contexts/Signup';
import Login from './contexts/Login';

function AppContent() {
  const { token, user, logout, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) return <div>Loading...</div>;

  if (!token || !user) {
    return (
      <div>
        <h2>Generate professional cover letters in seconds</h2>
        {showLogin ? (
          <>
            <Login onSuccess={() => {}} />
            <p>
              Don't have an account?{' '}
              <button onClick={() => setShowLogin(false)}>Sign Up</button>
            </p>
          </>
        ) : (
          <>
            <Signup onSuccess={() => setShowLogin(true)} />
            <p>
              Already have an account?{' '}
              <button onClick={() => setShowLogin(true)}>Login</button>
            </p>
          </>
        )}
      </div>
    );
  }

  // Authenticated
  return (
    <div>
      <InputForm />
      <button onClick={logout} className="reset-button">
        Log out
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
