import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import { parseSubscriberFile } from '../../utils/parseSubscriberFile';
import './AdminDashboard.css';

/* ── Lazy-loaded feature panels ── */
const SpotifyPanel = lazy(() => import('./panels/SpotifyPanel'));
const SocialPanel = lazy(() => import('./panels/SocialPanel'));
const MerchPanel = lazy(() => import('./panels/MerchPanel'));
const PressKitPanel = lazy(() => import('./panels/PressKitPanel'));
const SetlistPanel = lazy(() => import('./panels/SetlistPanel'));
const BookingPanel = lazy(() => import('./panels/BookingPanel'));
const EmailPanel = lazy(() => import('./panels/EmailPanel'));
const RevenuePanel = lazy(() => import('./panels/RevenuePanel'));
const FanMapPanel = lazy(() => import('./panels/FanMapPanel'));

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
  const [siteAnalytics, setSiteAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [popupImageUrl, setPopupImageUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [tourDates, setTourDates] = useState([]);
  const [tourSaveStatus, setTourSaveStatus] = useState('idle');
  const [importState, setImportState] = useState('idle'); // idle | parsing | importing
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const subscriberData = await vercelEmailStorageService.getSubscribers();
      const analyticsData = await vercelEmailStorageService.getAnalytics();
      const imageUrl = await vercelEmailStorageService.getPopupImage();
      const tourData = await vercelEmailStorageService.getTourDates();
      const siteData = await vercelEmailStorageService.getSiteAnalytics();

      setSubscribers(subscriberData);
      setAnalytics(analyticsData);
      setPopupImageUrl(imageUrl);
      setTourDates(tourData);
      setSiteAnalytics(siteData);
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

  const handleRemoveSubscriber = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
      const result = await vercelEmailStorageService.removeSubscriber(email);
      if (result.success) {
        loadData();
        alert('Subscriber removed successfully');
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    setUploadStatus('uploading');
    const result = await vercelEmailStorageService.uploadPopupImage(file);
    if (result.success) {
      setPopupImageUrl(result.imageUrl);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } else {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
    e.target.value = '';
  };

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
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Icons.Music />
          <span className="brand-text">NM Admin</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icons.BarChart />
            <span>Overview</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            <Icons.Users />
            <span>Subscribers</span>
            {subscribers.length > 0 && (
              <span className="sidebar-badge">{subscribers.length}</span>
            )}
          </button>
          <button
            className={`sidebar-link ${activeTab === 'tour' ? 'active' : ''}`}
            onClick={() => setActiveTab('tour')}
          >
            <Icons.MapPin />
            <span>Tour Dates</span>
            {tourStats.upcoming > 0 && (
              <span className="sidebar-badge accent">{tourStats.upcoming}</span>
            )}
          </button>
          <button
            className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Icons.Eye />
            <span>Analytics</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Icons.Settings />
            <span>Settings</span>
          </button>

          <div className="sidebar-divider" />
          <span className="sidebar-section-label">Features</span>

          <button
            className={`sidebar-link ${activeTab === 'spotify' ? 'active' : ''}`}
            onClick={() => setActiveTab('spotify')}
          >
            <Icons.Music />
            <span>Spotify</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <Icons.Globe />
            <span>Social Media</span>
          </button>
          {/* <button
            className={`sidebar-link ${activeTab === 'merch' ? 'active' : ''}`}
            onClick={() => setActiveTab('merch')}
          >
            <Icons.ShoppingBag />
            <span>Merch Sales</span>
          </button> */}
          {/* <button
            className={`sidebar-link ${activeTab === 'pressKit' ? 'active' : ''}`}
            onClick={() => setActiveTab('pressKit')}
          >
            <Icons.FileText />
            <span>Press Kit</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'setlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('setlists')}
          >
            <Icons.ListMusic />
            <span>Setlists</span>
          </button> */}
          <button
            className={`sidebar-link ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <Icons.Inbox />
            <span>Booking</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Icons.Mail />
            <span>Email</span>
          </button>
          {/* <button
            className={`sidebar-link ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <Icons.DollarSign />
            <span>Revenue</span>
          </button> */}
          <button
            className={`sidebar-link ${activeTab === 'fanMap' ? 'active' : ''}`}
            onClick={() => setActiveTab('fanMap')}
          >
            <Icons.MapPin />
            <span>Fan Map</span>
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
            <h1 className="page-title">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'subscribers' && 'Subscribers'}
              {activeTab === 'tour' && 'Tour Dates'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'spotify' && 'Spotify Stats'}
              {activeTab === 'social' && 'Social Media'}
              {activeTab === 'merch' && 'Merch Sales'}
              {activeTab === 'pressKit' && 'Press Kit'}
              {activeTab === 'setlists' && 'Setlist Manager'}
              {activeTab === 'booking' && 'Booking Requests'}
              {activeTab === 'email' && 'Email Campaigns'}
              {activeTab === 'revenue' && 'Revenue Summary'}
              {activeTab === 'fanMap' && 'Fan Map'}
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
                      <span className="stat-card-label">Total Subscribers</span>
                      <span className="stat-card-value">{analytics.totalSubscribers}</span>
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
                    <button className="panel-action" onClick={() => setActiveTab('subscribers')}>
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
                      <button onClick={() => setActiveTab('tour')} className="action-item">
                        <div className="action-item-icon">
                          <Icons.MapPin />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">Manage Tour</span>
                          <span className="action-item-desc">Add or edit shows</span>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('settings')} className="action-item">
                        <div className="action-item-icon">
                          <Icons.Image />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">Update Popup</span>
                          <span className="action-item-desc">Change hero image</span>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('analytics')} className="action-item">
                        <div className="action-item-icon">
                          <Icons.BarChart />
                        </div>
                        <div className="action-item-text">
                          <span className="action-item-title">View Analytics</span>
                          <span className="action-item-desc">Traffic & engagement</span>
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
                    <button className="panel-action" onClick={() => setActiveTab('tour')}>
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
                  <span className="toolbar-count">{subscribers.length} total subscribers</span>
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
                      <span className="email">{subscriber.email}</span>
                      <span className="date">{formatDate(subscriber.subscribed_at)}</span>
                      <span className={`source-badge src-${subscriber.source}`}>{subscriber.source}</span>
                      <span className="actions">
                        <button
                          onClick={() => handleRemoveSubscriber(subscriber.email)}
                          className="btn-icon btn-icon-danger"
                          title="Remove subscriber"
                        >
                          <Icons.Trash />
                        </button>
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
                  <Icons.AlertCircle /> Failed to save. Try again.
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
              {!siteAnalytics ? (
                <div className="empty-state">
                  <Icons.BarChart />
                  <h3>No analytics data yet</h3>
                  <p>Data will appear once visitors start browsing the site.</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-card-icon icon-blue">
                        <Icons.Eye />
                      </div>
                      <div className="stat-card-info">
                        <span className="stat-card-label">Today</span>
                        <span className="stat-card-value">{siteAnalytics.summary.today}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-purple">
                        <Icons.Calendar />
                      </div>
                      <div className="stat-card-info">
                        <span className="stat-card-label">Last 7 Days</span>
                        <span className="stat-card-value">{siteAnalytics.summary.last7d}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-green">
                        <Icons.TrendingUp />
                      </div>
                      <div className="stat-card-info">
                        <span className="stat-card-label">Last 30 Days</span>
                        <span className="stat-card-value">{siteAnalytics.summary.last30d}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-amber">
                        <Icons.Globe />
                      </div>
                      <div className="stat-card-info">
                        <span className="stat-card-label">All Time</span>
                        <span className="stat-card-value">{siteAnalytics.summary.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Traffic Chart */}
                  {siteAnalytics.dailyViews && siteAnalytics.dailyViews.length > 0 && (
                    <div className="panel">
                      <div className="panel-header">
                        <h2 className="panel-title">Daily Traffic (Last 30 Days)</h2>
                      </div>
                      <div className="panel-body">
                        <div className="daily-chart">
                          {(() => {
                            const max = Math.max(...siteAnalytics.dailyViews.map(d => d.views), 1);
                            return siteAnalytics.dailyViews.map((day) => (
                              <div key={day.date} className="chart-bar-wrapper" title={`${day.date}: ${day.views} views`}>
                                <div
                                  className="chart-bar"
                                  style={{ height: `${(day.views / max) * 100}%` }}
                                />
                                <span className="chart-label">
                                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two Column Analytics */}
                  <div className="analytics-two-col">
                    <div className="panel">
                      <div className="panel-header">
                        <h2 className="panel-title">Traffic Sources</h2>
                      </div>
                      <div className="panel-body">
                        {siteAnalytics.sources && siteAnalytics.sources.length > 0 ? (
                          <div className="analytics-list">
                            {siteAnalytics.sources.map((s) => (
                              <div key={s.source} className="analytics-list-item">
                                <span className={`source-indicator src-${s.source}`}>{s.source}</span>
                                <span className="analytics-list-value">{s.views}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-activity">No source data yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="panel-header">
                        <h2 className="panel-title">Top Pages</h2>
                      </div>
                      <div className="panel-body">
                        {siteAnalytics.topPages && siteAnalytics.topPages.length > 0 ? (
                          <div className="analytics-list">
                            {siteAnalytics.topPages.map((p) => (
                              <div key={p.page} className="analytics-list-item">
                                <span className="analytics-list-label">{p.page}</span>
                                <span className="analytics-list-value">{p.views}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-activity">No page data yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-two-col">
                    <div className="panel">
                      <div className="panel-header">
                        <h2 className="panel-title">Devices</h2>
                      </div>
                      <div className="panel-body">
                        {siteAnalytics.devices && siteAnalytics.devices.length > 0 ? (
                          <div className="analytics-list">
                            {siteAnalytics.devices.map((d) => (
                              <div key={d.device} className="analytics-list-item">
                                <span className="analytics-list-label device-label">
                                  {d.device === 'mobile' ? <Icons.Smartphone /> : d.device === 'tablet' ? <Icons.Tablet /> : <Icons.Monitor />}
                                  {d.device}
                                </span>
                                <span className="analytics-list-value">{d.views}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-activity">No device data yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="panel-header">
                        <h2 className="panel-title">Top Referrers</h2>
                      </div>
                      <div className="panel-body">
                        {siteAnalytics.topReferrers && siteAnalytics.topReferrers.length > 0 ? (
                          <div className="analytics-list">
                            {siteAnalytics.topReferrers.map((r) => (
                              <div key={r.referrer} className="analytics-list-item">
                                <span className="analytics-list-label">{r.referrer}</span>
                                <span className="analytics-list-value">{r.views}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-activity">No referrer data yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              {/* Popup Hero Image */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">
                    <Icons.Image />
                    Popup Hero Image
                  </h2>
                </div>
                <div className="panel-body">
                  <p className="section-desc">This image appears in the newsletter signup popup shown to first-time visitors.</p>
                  <div className="image-upload-section">
                    <div className="image-preview-wrapper">
                      {popupImageUrl ? (
                        <img src={popupImageUrl} alt="Current popup hero" className="popup-image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <Icons.Image />
                          <p>Default image in use</p>
                        </div>
                      )}
                    </div>
                    <div className="upload-controls">
                      <label
                        className={`upload-zone${uploadStatus === 'uploading' ? ' uploading' : ''}`}
                        htmlFor="popup-image-upload"
                      >
                        <input
                          id="popup-image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploadStatus === 'uploading'}
                          style={{ display: 'none' }}
                        />
                        <Icons.Upload />
                        <span className="upload-label">
                          {uploadStatus === 'uploading' ? 'Uploading...' : 'Click to upload a new image'}
                        </span>
                        <span className="upload-hint">JPG, PNG or WebP · Max 5 MB</span>
                      </label>
                      {uploadStatus === 'success' && (
                        <div className="toast toast-success">
                          <Icons.Check /> Image updated successfully
                        </div>
                      )}
                      {uploadStatus === 'error' && (
                        <div className="toast toast-error">
                          <Icons.AlertCircle /> Upload failed. Please try again.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
            {activeTab === 'merch' && <MerchPanel Icons={Icons} />}
            {activeTab === 'pressKit' && <PressKitPanel Icons={Icons} />}
            {activeTab === 'setlists' && <SetlistPanel Icons={Icons} />}
            {activeTab === 'booking' && <BookingPanel Icons={Icons} />}
            {activeTab === 'email' && <EmailPanel Icons={Icons} />}
            {activeTab === 'revenue' && <RevenuePanel Icons={Icons} />}
            {activeTab === 'fanMap' && <FanMapPanel Icons={Icons} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
 
