import React, { useState } from 'react';
import { validateEmail } from '../../utils/helpers';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import './BookingForm.css';

const EVENT_TYPES = [
  { value: 'private', label: 'Private Event' },
  { value: 'venue', label: 'Venue / Club' },
  { value: 'festival', label: 'Festival' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  eventType: 'private',
  eventDate: '',
  venue: '',
  city: '',
  budget: '',
  message: '',
  company: '', // honeypot — must stay empty
};

const BookingForm = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and a message.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    const result = await vercelEmailStorageService.submitBookingRequest(form);

    if (result.success) {
      setStatus('success');
      setForm(EMPTY_FORM);
    } else {
      setStatus('error');
      setError(result.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="booking-success" role="status">
        <span className="booking-success-icon" aria-hidden="true">
          <i className="fa-solid fa-circle-check" />
        </span>
        <h2>Request received!</h2>
        <p>Thanks for reaching out. We&apos;ll review your request and respond by email soon.</p>
        <button
          type="button"
          className="booking-btn booking-btn-secondary"
          onClick={() => setStatus('idle')}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      <p className="booking-intro">
        Looking to book Nickola Magnolia for a show, festival, or private event?
        Share the details below and we&apos;ll get back to you.
      </p>

      <div className="booking-row">
        <label className="booking-field">
          <span className="booking-label">Name <span className="booking-required">*</span></span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your name"
            maxLength={200}
            required
          />
        </label>
        <label className="booking-field">
          <span className="booking-label">Email <span className="booking-required">*</span></span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            maxLength={200}
            required
          />
        </label>
      </div>

      <div className="booking-row">
        <label className="booking-field">
          <span className="booking-label">Event Type</span>
          <select
            value={form.eventType}
            onChange={(e) => handleChange('eventType', e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="booking-field">
          <span className="booking-label">Event Date</span>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => handleChange('eventDate', e.target.value)}
          />
        </label>
      </div>

      <div className="booking-row">
        <label className="booking-field">
          <span className="booking-label">Venue</span>
          <input
            type="text"
            value={form.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            placeholder="Venue name"
            maxLength={200}
          />
        </label>
        <label className="booking-field">
          <span className="booking-label">City</span>
          <input
            type="text"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="City, State"
            maxLength={200}
          />
        </label>
      </div>

      <label className="booking-field">
        <span className="booking-label">Budget</span>
        <input
          type="text"
          value={form.budget}
          onChange={(e) => handleChange('budget', e.target.value)}
          placeholder="Optional — e.g. $2,000–$5,000"
          maxLength={100}
        />
      </label>

      <label className="booking-field">
        <span className="booking-label">Message / Event Details <span className="booking-required">*</span></span>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Tell us about your event — date, location, audience size, and anything else we should know."
          maxLength={5000}
          required
        />
      </label>

      {/* Honeypot — hidden from real users; bots tend to fill it. */}
      <div className="booking-hp" aria-hidden="true">
        <label>
          Company
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
          />
        </label>
      </div>

      {error && <p className="booking-error" role="alert">{error}</p>}

      <button
        type="submit"
        className="booking-btn booking-btn-primary"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending…' : 'Send Booking Request'}
      </button>
    </form>
  );
};

export default BookingForm;
