'use client';
import './Signup.css'
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Signup({ onSuccess }) {
  const { setToken, fetchUserProfile } = useAuth();
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const { message } = await res.json();
        setError(message || 'Signup failed');
        return;
      }
      // Direct user to login since verification is usually required.
      onSuccess(true);
    } catch {
      setError('Error connecting to server');
    }
  };

  return (
    <form onSubmit={onSubmit} className='signup-form'>
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
      <input name="phone" type="tel" placeholder="Phone" value={form.phone} onChange={onChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required minLength={6} />
      <button>Sign Up</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
