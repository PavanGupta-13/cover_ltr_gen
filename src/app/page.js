'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputForm from './components/InputForm';
import './globals.css';

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    linkedin: ''
  });
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token in localStorage or URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const storedToken = localStorage.getItem('userToken');
    
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('userToken', urlToken);
    } else if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    
    // Generate a token
    const generatedToken = btoa(formData.email + Date.now()).substring(0, 12);
    
    // Store all user data
    localStorage.setItem('userData', JSON.stringify(formData));
    localStorage.setItem('userToken', generatedToken);
    localStorage.setItem('usesRemaining', 1); // Set initial usage limit
    
    // Redirect with token
    router.push(`?token=${generatedToken}`);
    setToken(generatedToken);
  };

  const handleReset = () => {
    // Clear token and redirect to landing page
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('usesRemaining');
    setToken(null);
  };

  // If token exists, show the application
  if (token) {
    return (
      <div>
        <InputForm />
        <button onClick={handleReset} className="reset-button">
          Reset Application
        </button>
      </div>
    );
  }

  // If no token, show the email form
  return (
    <div className="welcome-container">
      <h1>Generate professional cover letters in seconds</h1>
      {/* <p className="subtitle">Generate professional cover letters in seconds</p> */}
      
      <form onSubmit={handleSubmit} className="email-form">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name (e.g. Monica Sruthi Chillapalli)"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address (e.g. Scarborough, ON M1E 4S8)"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number (e.g. 437-766-8027)"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="linkedin"
          placeholder="LinkedIn URL (e.g. linkedin.com/in/monica-sruthi/)"
          value={formData.linkedin}
          onChange={handleChange}
          required
        />
        <button type="submit">Generate Free Cover Letter</button>
      </form>
      
      <p className="disclaimer">
        You'll get 1 free cover letter. No credit card required.
      </p>
    </div>
  );
}
