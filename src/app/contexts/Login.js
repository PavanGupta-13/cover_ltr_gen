'use client';

import './Login.css'
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Login({ onSuccess }) {
  const { setToken, setUser, fetchUserProfile } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const { message } = await res.json();
        setError(message || 'Login failed');
        return;
      }
      const data = await res.json();
      setToken(data.token); // AuthContext
      await fetchUserProfile(data.token);
      onSuccess(true);
    } catch {
      setError('Server error');
    }
  };

  return (
    <form onSubmit={onSubmit} className='login-form'>
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required minLength={6} />
      <button>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
