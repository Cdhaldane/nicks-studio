import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import { parseSubscriberFile } from '../../utils/parseSubscriberFile';
import './AdminDashboard.css';

/* ── Lazy-loaded feature panels ── */
const SpotifyPanel = lazy(() => import('./panels/SpotifyPanel'));
const SocialPanel = lazy(() => import('./panels/SocialPanel'));
const BookingPanel = lazy(() => import('./panels/BookingPanel'));
const EmailPanel = lazy(() => import('./panels/EmailPanel'));
const FanMapPanel = lazy(() => import('./panels/FanMapPanel'));
const AnnouncementPanel = lazy(() => import('./panels/AnnouncementPanel'));

/* ── SVG Icon Components ── */
const Icons = {
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  Music: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  RefreshCw: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowUpDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" /><polyline points="8 6 12 2 16 6" /><polyline points="8 18 12 22 16 18" />
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Image: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Monitor: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Smartphone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Tablet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  DollarSign: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  ListMusic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15V6" /><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M12 12H3" /><path d="M16 6H3" /><path d="M12 18H3" />
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Inbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  Megaphone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const EMPTY_DATE = { date: '', city: '', venue: '', ticketsUrl: '', note: '' };

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatTourDate = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateParts = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    year: d.getFullYear(),
  };
};

const AdminDashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tourDates, setTourDates] = useState([]);
  const [tourSaveStatus, setTourSaveStatus] = useState('idle');
  const [tourSaveError, setTourSaveError] = useState('');
  const [importState, setImportState] = useState('idle'); // idle | parsing | importing
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  /* Close the mobile drawer on Escape, and lock body scroll while it's open */
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  /* Navigating always closes the drawer — on desktop it's a no-op */
  const selectTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // `loading` is only true for the first load. Refreshes leave the open panel
  // mounted, so a half-written campaign survives clicking Refresh.
  const loadData = async () => {
    try {
      const [subscriberData, tourData] = await Promise.all([
        vercelEmailStorageService.getSubscribers(),
        vercelEmailStorageService.getTourDates(),
      ]);

      setSubscribers(subscriberData);
      setAnalytics(vercelEmailStorageService.getAnalytics(subscriberData));
      setTourDates(tourData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await vercelEmailStorageService.exportSubscribers();
  };

  const handleDownloadJSON = async () => {
    await vercelEmailStorageService.downloadCurrentData();
  };

  // Unsubscribes rather than deletes: the row stays as an opt-out record, so a
  // later spreadsheet import can't quietly re-add someone who asked to leave.
  const handleRemoveSubscriber = async (email) => {
    if (window.confirm(`Unsubscribe ${email}? They won't receive any more campaigns.`)) {
      const result = await vercelEmailStorageService.removeSubscriber(email);
      if (result.success) {
        loadData();
        alert(`${email} has been unsubscribed.`);
      } else {
        alert(result.message);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleImportFileSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setImportError(null);
    setImportResult(null);
    setImportState('parsing');
    try {
      const { subscribers: parsed, stats } = await parseSubscriberFile(file);
      if (parsed.length === 0) {
        setImportError('No valid email addresses were found in that file.');
        setImportState('idle');
        return;
      }
      const existingEmails = new Set(subscribers.map((s) => s.email));
      const newSubscribers = parsed.filter((p) => !existingEmails.has(p.email));
      setImportPreview({
        fileName: file.name,
        total: parsed.length,
        newSubscribers,
        alreadySubscribed: parsed.length - newSubscribers.length,
        stats,
      });
    } catch (error) {
      setImportError(error.message || 'Could not read that file.');
    } finally {
      setImportState('idle');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.newSubscribers.length === 0) return;
    setImportState('importing');
    const result = await vercelEmailStorageService.importSubscribers(
      importPreview.newSubscribers
    );
    if (result.success) {
      setImportResult(result);
      setImportPreview(null);
      await loadData();
    } else {
      setImportError(result.message || 'Import failed.');
    }
    setImportState('idle');
  };

  const handleCancelImport = () => {
    setImportPreview(null);
    setImportError(null);
  };

  const handleTourDateChange = (index, field, value) => {
    setTourDates(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleAddTourDate = () => {
    setTourDates(prev => [...prev, { ...EMPTY_DATE }]);
  };

  const handleRemoveTourDate = (index) => {
    setTourDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTourDates = async () => {
    setTourSaveStatus('saving');
    const result = await vercelEmailStorageService.saveTourDates(tourDates);
    // The API names the problem (e.g. a row missing its venue) — show that.
    setTourSaveError(result.success ? '' : result.message || '');
    setTourSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setTourSaveStatus('idle'), 3000);
  };

  const handleSortTourDates = () => {
    setTourDates(prev => {
      const withDates = prev.filter(d => d.date);
      const withoutDates = prev.filter(d => !d.date);
      withDates.sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
      return [...withDates, ...withoutDates];
    });
  };

  const tourStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = 0;
    let past = 0;
    tourDates.forEach(d => {
      const parsed = parseLocalDate(d.date);
      if (!parsed) return;
      if (parsed >= today) upcoming += 1;
      else past += 1;
    });
    return { upcoming, past };
  }, [tourDates]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRecentSubscribers = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return subscribers.filter(sub =>
      new Date(sub.subscribed_at) >= cutoffDate
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="loading-spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile drawer backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Icons.Music />
          <span className="brand-text">NM Admin</span>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <Icons.X />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => selectTab('overview')}
          >
            <Icons.BarChart />
            <span>Overview</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => selectTab('subscribers')}
          >
            <Icons.Users />
            <span>Subscribers</span>
            {subscribers.length > 0 && (
              <span className="sidebar-badge">{subscribers.length}</span>
            )}
          </button>
          <button
            className={`sidebar-link ${activeTab === 'tour' ? 'active' : ''}`}
            onClick={() => selectTab('tour')}
          >
            <Icons.MapPin />
            <span>Tour Dates</span>
            {tourStats.upcoming > 0 && (
              <span className="sidebar-badge accent">{tourStats.upcoming}</span>
            )}
          </button>
          <button
            className={`sidebar-link ${activeTab === 'announcement' ? 'active' : ''}`}
            onClick={() => selectTab('announcement')}
          >
            <Icons.Megaphone />
            <span>Announcement</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => selectTab('analytics')}
          >
            <Icons.Eye />
            <span>Analytics</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => selectTab('settings')}
          >
            <Icons.Settings />
            <span>Settings</span>
          </button>

          <div className="sidebar-divider" />
          <span className="sidebar-section-label">Features</span>

          <button
            className={`sidebar-link ${activeTab === 'spotify' ? 'active' : ''}`}
            onClick={() => selectTab('spotify')}
          >
            <Icons.Music />
            <span>Spotify</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => selectTab('social')}
          >
            <Icons.Globe />
            <span>Social Media</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => selectTab('booking')}
          >
            <Icons.Inbox />
            <span>Booking</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => selectTab('email')}
          >
            <Icons.Mail />
            <span>Email</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'fanMap' ? 'active' : ''}`}
            onClick={() => selectTab('fanMap')}
          >
            <Icons.Users />
            <span>Audience</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <Icons.LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
            >
              <Icons.Menu />
            </button>
            <h1 className="page-title">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'subscribers' && 'Subscribers'}
              {activeTab === 'tour' && 'Tour Dates'}
              {activeTab === 'announcement' && 'Announcement Popup'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'spotify' && 'Spotify Stats'}
              {activeTab === 'social' && 'Social Media'}
              {activeTab === 'booking' && 'Booking Requests'}
              {activeTab === 'email' && 'Email Campaigns'}
              {activeTab === 'fanMap' && 'Audience'}
            </h1>
          </div>
          <div className="topbar-right">
            <button onClick={loadData} className="topbar-btn" title="Refresh data">
              <Icons.RefreshCw />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Stat Cards */}
              {analytics && (
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-card-icon icon-purple">
                      <Icons.Users />
                    </div>
                    <div className="stat-card-info">
                      <span className="stat-card-label">Active Subscribers</span>
                      <span className="stat-card-value">{analytics.activeSubscribers}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon icon-blue">
                      <Icons.TrendingUp />
                    </div>
                    <div className="stat-card-info">
                      <span className="stat-card-label">This Week</span>
                      <span className="stat-card-value">{getRecentSubscribers(7).length}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon icon-green">
                      <Icons.Calendar />
                    </div>
                    <div className="stat-card-info">
                      <span className="stat-card-label">This Month</span>
                      <span className="stat-card-value">{getRecentSubscribers(30).length}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon icon-amber">
                      <Icons.Zap />
                    </div>
                    <div className="stat-card-info">
                      <span className="stat-card-label">Growth Rate</span>
                      <span className="stat-card-value">
                        {subscribers.length > 0
                          ? '+' + Math.round((getRecentSubscribers(7).length / subscribers.length) * 100) + '%'
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="overview-grid">
                {/* Recent Activity */}
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Recent Subscribers</h2>
                    <button className="panel-action" onClick={() => selectTab('subscribers')}>
                      View all
                    </button>
                  </div>
                  <div className="panel-body">
                    {getRecentSubscribers(7).length > 0 ? (
                      <div className="activity-list">
                        {getRecentSubscribers(7).slice(0, 5).map((subscriber) => (
                          <div key={subscriber.id} className="activity-item">
                            <div className="activity-avatar">
                              {subscriber.email[0].toUpperCase()}
                            </div>
                            <div className="activity-info">
                              <span className="activity-email">{subscriber.email}</span>
                              <span className="activity-date">{formatDate(subscriber.subscribed_at)}</span>
                            </div>
                            <span className={`source-badge src-${subscriber.source}`}>{subscriber.source}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-inline">
                        <Icons.Users />
                        <p>No new subscribers this week</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Quick Actions</h2>
                  </div>
                  <div className="panel-body">
                    <div className="actions-list">
                      <button onClick={handleDownloadJSON} className="action-item">
                        <div className="action-item-icon">
                          <Icons.Download />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">Export Subscribers</span>
                          <span className="action-item-desc">Download JSON backup</span>
                        </div>
                      </button>
                      <button onClick={() => selectTab('tour')} className="action-item">
                        <div className="action-item-icon">
                          <Icons.MapPin />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">Manage Tour</span>
                          <span className="action-item-desc">Add or edit shows</span>
                        </div>
                      </button>
                      <button onClick={() => selectTab('analytics')} className="action-item">
                        <div className="action-item-icon">
                          <Icons.BarChart />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">View Analytics</span>
                          <span className="action-item-desc">Traffic in Google Analytics</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Shows Preview */}
              {tourStats.upcoming > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Upcoming Shows</h2>
                    <button className="panel-action" onClick={() => selectTab('tour')}>
                      Manage
                    </button>
                  </div>
                  <div className="panel-body">
                    <div className="upcoming-shows-list">
                      {tourDates
                        .filter(d => {
                          const parsed = parseLocalDate(d.date);
                          if (!parsed) return false;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return parsed >= today;
                        })
                        .slice(0, 3)
                        .map((show, idx) => {
                          const parts = getDateParts(show.date);
                          return (
                            <div key={idx} className="upcoming-show-item">
                              <div className="upcoming-show-date">
                                <span className="show-month">{parts?.month}</span>
                                <span className="show-day">{parts?.day}</span>
                              </div>
                              <div className="upcoming-show-info">
                                <span className="show-venue">{show.venue || 'TBD'}</span>
                                <span className="show-city">{show.city || 'TBD'}</span>
                              </div>
                              {show.ticketsUrl && (
                                <a href={show.ticketsUrl} target="_blank" rel="noopener noreferrer" className="show-tickets-link">
                                  <Icons.ExternalLink />
                                </a>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="subscribers-tab">
              <div className="tab-toolbar">
                <div className="toolbar-info">
                  <span className="toolbar-count">
                    {analytics?.activeSubscribers ?? subscribers.length} active
                    {analytics && analytics.activeSubscribers !== subscribers.length &&
                      ` · ${subscribers.length - analytics.activeSubscribers} unsubscribed`}
                  </span>
                </div>
                <div className="toolbar-actions">
                  <label
                    className={`btn btn-secondary btn-sm${importState === 'parsing' ? ' is-busy' : ''}`}
                    title="Import subscribers from an .xlsx or .csv file"
                  >
                    <Icons.Upload />
                    <span>{importState === 'parsing' ? 'Reading…' : 'Import'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      onChange={handleImportFileSelect}
                      disabled={importState !== 'idle'}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button onClick={handleDownloadJSON} className="btn btn-secondary btn-sm">
                    <Icons.Download />
                    <span>Download</span>
                  </button>
                  <button onClick={handleExport} className="btn btn-primary btn-sm">
                    <Icons.Upload />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {importError && (
                <div className="toast toast-error">
                  <Icons.AlertCircle /> {importError}
                </div>
              )}
              {importResult && (
                <div className="toast toast-success">
                  <Icons.Check /> Imported {importResult.imported} new subscriber
                  {importResult.imported === 1 ? '' : 's'}
                  {importResult.duplicates > 0 && ` · ${importResult.duplicates} already subscribed`}
                  {importResult.invalid > 0 && ` · ${importResult.invalid} skipped`}
                </div>
              )}

              {importPreview && (
                <div className="panel import-preview">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      <Icons.Upload />
                      Import preview — {importPreview.fileName}
                    </h2>
                  </div>
                  <div className="panel-body">
                    <div className="import-summary">
                      <div className="import-stat">
                        <span className="import-stat-value">{importPreview.newSubscribers.length}</span>
                        <span className="import-stat-label">New</span>
                      </div>
                      <div className="import-stat">
                        <span className="import-stat-value">{importPreview.alreadySubscribed}</span>
                        <span className="import-stat-label">Already subscribed</span>
                      </div>
                      <div className="import-stat">
                        <span className="import-stat-value">{importPreview.stats.skipped}</span>
                        <span className="import-stat-label">Rows skipped</span>
                      </div>
                    </div>

                    {importPreview.newSubscribers.length > 0 ? (
                      <>
                        <div className="import-preview-list">
                          {importPreview.newSubscribers.slice(0, 5).map((s, i) => (
                            <div key={i} className="import-preview-row">
                              <span className="import-preview-name">{s.name || '—'}</span>
                              <span className="import-preview-email">{s.email}</span>
                            </div>
                          ))}
                          {importPreview.newSubscribers.length > 5 && (
                            <div className="import-preview-more">
                              +{importPreview.newSubscribers.length - 5} more
                            </div>
                          )}
                        </div>
                        <div className="email-actions">
                          <button
                            onClick={handleConfirmImport}
                            className="btn btn-primary"
                            disabled={importState === 'importing'}
                          >
                            {importState === 'importing'
                              ? 'Importing…'
                              : `Import ${importPreview.newSubscribers.length} subscriber${
                                  importPreview.newSubscribers.length === 1 ? '' : 's'
                                }`}
                          </button>
                          <button
                            onClick={handleCancelImport}
                            className="btn btn-ghost"
                            disabled={importState === 'importing'}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="no-activity">
                          All {importPreview.total} contacts in this file are already subscribed.
                        </p>
                        <div className="email-actions">
                          <button onClick={handleCancelImport} className="btn btn-ghost">
                            Dismiss
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {subscribers.length === 0 ? (
                <div className="empty-state">
                  <Icons.Users />
                  <h3>No subscribers yet</h3>
                  <p>The list will appear here when people sign up — or use Import above.</p>
                </div>
              ) : (
                <div className="subscribers-table">
                  <div className="table-header">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Subscribed</span>
                    <span>Source</span>
                    <span>Actions</span>
                  </div>
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="table-row">
                      <span className="sub-name">{subscriber.name || '—'}</span>
                      <span className="email">
                        {subscriber.email}
                        {subscriber.status === 'unsubscribed' && (
                          <span className="unsubscribed-tag">Unsubscribed</span>
                        )}
                      </span>
                      <span className="date">{formatDate(subscriber.subscribed_at)}</span>
                      <span className={`source-badge src-${subscriber.source}`}>{subscriber.source}</span>
                      <span className="actions">
                        {subscriber.status !== 'unsubscribed' && (
                          <button
                            onClick={() => handleRemoveSubscriber(subscriber.email)}
                            className="btn-icon btn-icon-danger"
                            title="Unsubscribe"
                            aria-label={`Unsubscribe ${subscriber.email}`}
                          >
                            <Icons.Trash />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tour' && (
            <div className="tour-tab">
              <div className="tab-toolbar">
                <div className="toolbar-info">
                  <div className="tour-stats">
                    <span className="tour-stat tour-stat-upcoming">
                      <span className="stat-dot" /> {tourStats.upcoming} upcoming
                    </span>
                    <span className="tour-stat tour-stat-past">
                      <span className="stat-dot" /> {tourStats.past} past
                    </span>
                  </div>
                </div>
                <div className="toolbar-actions">
                  {tourDates.length > 1 && (
                    <button onClick={handleSortTourDates} className="btn btn-ghost btn-sm" title="Sort by date">
                      <Icons.ArrowUpDown />
                      <span>Sort</span>
                    </button>
                  )}
                  <button onClick={handleAddTourDate} className="btn btn-secondary btn-sm">
                    <Icons.Plus />
                    <span>Add Date</span>
                  </button>
                  <button
                    onClick={handleSaveTourDates}
                    className="btn btn-primary btn-sm"
                    disabled={tourSaveStatus === 'saving'}
                  >
                    {tourSaveStatus === 'saving' ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Icons.Check />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {tourSaveStatus === 'success' && (
                <div className="toast toast-success">
                  <Icons.Check /> Tour dates saved successfully
                </div>
              )}
              {tourSaveStatus === 'error' && (
                <div className="toast toast-error">
                  <Icons.AlertCircle /> {tourSaveError || 'Failed to save. Try again.'}
                </div>
              )}

              {tourDates.length === 0 ? (
                <div className="empty-state">
                  <Icons.Mic />
                  <h3>No tour dates yet</h3>
                  <p>Add your first show to get started.</p>
                  <button onClick={handleAddTourDate} className="btn btn-primary">
                    <Icons.Plus />
                    <span>Add First Date</span>
                  </button>
                </div>
              ) : (
                <div className="tour-editor-list">
                  {tourDates.map((show, index) => {
                    const parts = getDateParts(show.date);
                    const parsed = parseLocalDate(show.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = parsed && parsed < today;
                    const isIncomplete = !show.date || !show.city || !show.venue;

                    return (
                      <div
                        key={index}
                        className={`tour-card ${isPast ? 'is-past' : ''} ${isIncomplete ? 'is-incomplete' : ''}`}
                      >
                        <div className="tour-card-date-block">
                          {parts ? (
                            <>
                              <span className="tour-card-month">{parts.month}</span>
                              <span className="tour-card-day">{parts.day}</span>
                              <span className="tour-card-year">{parts.weekday} · {parts.year}</span>
                            </>
                          ) : (
                            <span className="tour-card-empty-date">No date</span>
                          )}
                          {isPast && <span className="tour-card-badge">Past</span>}
                        </div>

                        <div className="tour-card-body">
                          <div className="tour-card-row tour-card-row-primary">
                            <label className="tour-field tour-field-date">
                              <span className="tour-field-label">Date</span>
                              <input
                                type="date"
                                value={show.date}
                                onChange={(e) => handleTourDateChange(index, 'date', e.target.value)}
                              />
                            </label>
                            <label className="tour-field">
                              <span className="tour-field-label">City</span>
                              <input
                                type="text"
                                value={show.city}
                                placeholder="Toronto, ON"
                                onChange={(e) => handleTourDateChange(index, 'city', e.target.value)}
                              />
                            </label>
                            <label className="tour-field">
                              <span className="tour-field-label">Venue</span>
                              <input
                                type="text"
                                value={show.venue}
                                placeholder="The Horseshoe Tavern"
                                onChange={(e) => handleTourDateChange(index, 'venue', e.target.value)}
                              />
                            </label>
                          </div>
                          <div className="tour-card-row tour-card-row-secondary">
                            <label className="tour-field">
                              <span className="tour-field-label">Tickets URL</span>
                              <input
                                type="url"
                                value={show.ticketsUrl}
                                placeholder="https://..."
                                onChange={(e) => handleTourDateChange(index, 'ticketsUrl', e.target.value)}
                              />
                            </label>
                            <label className="tour-field">
                              <span className="tour-field-label">Note</span>
                              <input
                                type="text"
                                value={show.note}
                                placeholder="w/ special guest"
                                onChange={(e) => handleTourDateChange(index, 'note', e.target.value)}
                              />
                            </label>
                          </div>
                          {formatTourDate(show.date) && (
                            <div className="tour-card-preview">
                              <strong>{formatTourDate(show.date)}</strong>
                              {show.city && <> · {show.city}</>}
                              {show.venue && <> · {show.venue}</>}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveTourDate(index)}
                          className="tour-card-remove"
                          title="Remove this date"
                          aria-label="Remove tour date"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              {/* Traffic used to be logged to a Blob file on every page view, which
                  lost visits under load and burned the Blob quota. GA4 (index.html)
                  already records the same thing properly. */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">
                    <Icons.BarChart />
                    Site Traffic
                  </h2>
                </div>
                <div className="panel-body">
                  <p className="section-desc">
                    Visits, top pages, traffic sources and devices are tracked in Google Analytics.
                  </p>
                  <a
                    href="https://analytics.google.com/analytics/web/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <Icons.Eye />
                    <span>Open Google Analytics</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              {/* System Info */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">
                    <Icons.Settings />
                    System Information
                  </h2>
                </div>
                <div className="panel-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Email Storage</span>
                      <span className="info-value">Vercel Blob</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Hosting</span>
                      <span className="info-value">Vercel</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Subscriber</span>
                      <span className="info-value">{analytics?.lastUpdated ? formatDate(analytics.lastUpdated) : 'None yet'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Subscribers</span>
                      <span className="info-value">{analytics?.totalSubscribers ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="panel panel-danger">
                <div className="panel-header">
                  <h2 className="panel-title danger-title">
                    <Icons.AlertCircle />
                    Danger Zone
                  </h2>
                </div>
                <div className="panel-body">
                  <div className="danger-actions">
                    <button
                      onClick={() => alert('To delete all subscriber data, remove subscribers.json from your Vercel Blob store.')}
                      className="btn btn-danger"
                      disabled
                    >
                      <Icons.Trash />
                      <span>Clear All Data (Disabled)</span>
                    </button>
                    <p className="danger-note">
                      Manage data via Vercel Dashboard → Storage → Blob.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Panels */}
          <Suspense fallback={<div className="panel"><div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div></div>}>
            {activeTab === 'spotify' && <SpotifyPanel Icons={Icons} />}
            {activeTab === 'social' && <SocialPanel Icons={Icons} />}
            {activeTab === 'booking' && <BookingPanel Icons={Icons} />}
            {activeTab === 'email' && <EmailPanel Icons={Icons} />}
            {activeTab === 'fanMap' && <FanMapPanel Icons={Icons} />}
            {activeTab === 'announcement' && <AnnouncementPanel Icons={Icons} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
 
