import React, { useState, useEffect, useCallback, useMemo } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';
import CampaignRecipientsModal from './CampaignRecipientsModal';

const TEMPLATES = [
  {
    name: 'New Release',
    subject: '🎵 New Music Out Now!',
    body: "Hey there!\n\nI just released new music and wanted you to be the first to hear it.\n\nListen now: [LINK]\n\nThank you for your support!\n\n— Nickola Magnolia",
  },
  {
    name: 'Tour Announcement',
    subject: '🎤 Tour Dates Announced!',
    body: "Hey!\n\nI'm thrilled to announce new tour dates! Check them out and grab your tickets before they sell out.\n\nDates & Tickets: [LINK]\n\nSee you there!\n\n— Nickola Magnolia",
  },
  {
    name: 'Merch Drop',
    subject: '🛍️ New Merch Available',
    body: 'Hey!\n\nNew merch just dropped in the store. Limited quantities available.\n\nShop now: [LINK]\n\nThanks for repping!\n\n— Nickola Magnolia',
  },
];

const isSubscriberActive = (s) => (s.status || 'active') === 'active';

const STATUS_LABELS = {
  queued: 'Queued',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const EmailPanel = ({ Icons }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [quota, setQuota] = useState(null);
  const [verifyAddress, setVerifyAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [testAddress, setTestAddress] = useState('');

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(null); // 'test' | 'send'
  const [feedback, setFeedback] = useState(null); // { type, message }
  const [inspectingId, setInspectingId] = useState(null); // campaign open in the recipients modal

  const load = useCallback(async () => {
    const [subscriberData, campaignData] = await Promise.all([
      vercelEmailStorageService.getSubscribers(),
      vercelEmailStorageService.getCampaigns(),
    ]);
    setSubscribers(subscriberData);
    setCampaigns(campaignData.campaigns);
    setQuota(campaignData.quota);
    setVerifyAddress(campaignData.verifyAddress);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(
    () => subscribers.filter(isSubscriberActive).length,
    [subscribers]
  );

  const inFlight = useMemo(
    () => campaigns.find((c) => c.status === 'queued' || c.status === 'sending') || null,
    [campaigns]
  );

  // Held by id rather than by value so the modal follows the refreshed campaign
  // after a send or drain updates the counts underneath it.
  const inspecting = useMemo(
    () => campaigns.find((c) => c.id === inspectingId) || null,
    [campaigns, inspectingId]
  );

  const closeInspector = useCallback(() => setInspectingId(null), []);

  const canCompose = subject.trim().length > 0 && body.trim().length > 0;

  // Campaigns are capped below the provider's daily ceiling so test sends and the
  // verification copy always have room; the stat card reports the campaign figure.
  const campaignLimit = quota ? quota.campaignLimit ?? quota.limit : null;
  const remainingToday = quota ? Math.max(0, campaignLimit - quota.usedToday) : null;

  const handleTemplate = (template) => {
    setSubject(template.subject);
    setBody(template.body);
    setConfirming(false);
  };

  const handleTest = async () => {
    setBusy('test');
    setFeedback(null);
    const result = await vercelEmailStorageService.sendTestEmail({
      to: testAddress.trim(),
      subject,
      body,
    });
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    setBusy(null);
    if (result.success) load();
  };

  const handleSend = async () => {
    setBusy('send');
    setFeedback(null);
    const result = await vercelEmailStorageService.sendCampaign({ subject, body });
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    setBusy(null);
    setConfirming(false);
    if (result.success) {
      setSubject('');
      setBody('');
    }
    load();
  };

  const handleExportCSV = () => {
    const rows = ['Email,Status,Subscribed,Source'];
    subscribers.forEach((s) => {
      rows.push(
        `${s.email},${s.status || 'active'},${s.subscribed_at || ''},${s.source || ''}`
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty-state-inline">
            <div className="loading-spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.Users />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Active Recipients</span>
            <span className="stat-card-value">{activeCount}</span>
          </div>
        </div>
        {quota && (
          <div className="stat-card">
            <div className="stat-card-icon icon-purple">
              <Icons.Mail />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">Campaign Sends Left Today</span>
              <span className="stat-card-value">{remainingToday}</span>
              <span className="stat-card-sub">
                of {campaignLimit} · {Math.max(0, quota.limit - campaignLimit)} held back for tests
              </span>
            </div>
          </div>
        )}
      </div>

      {inFlight && (
        <div className="panel campaign-progress-panel">
          <div className="panel-body">
            <div className="campaign-progress-head">
              <strong>Sending “{inFlight.subject}”</strong>
              <span>
                {inFlight.sentCount} of {inFlight.totalRecipients}
              </span>
            </div>
            <div className="campaign-progress-track">
              <div
                className="campaign-progress-bar"
                style={{
                  width: `${Math.round((inFlight.sentCount / inFlight.totalRecipients) * 100)}%`,
                }}
              />
            </div>
            <p className="campaign-progress-note">
              {inFlight.pendingCount} remaining. The next batch goes out automatically tomorrow —
              no action needed.
            </p>
            <button
              onClick={() => setInspectingId(inFlight.id)}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
            >
              <Icons.Users /> See who has received it
            </button>
          </div>
        </div>
      )}

      <div className="email-layout">
        {/* Composer */}
        <div className="email-composer">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Compose Email</h2>
              <div className="toolbar-actions">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="btn btn-ghost btn-sm"
                >
                  <Icons.Eye /> {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>
            <div className="panel-body">
              {feedback && (
                <div className={`toast toast-${feedback.type === 'success' ? 'success' : 'error'}`}>
                  {feedback.type === 'success' && <Icons.Check />} {feedback.message}
                </div>
              )}

              {!previewMode ? (
                <div className="email-form">
                  <label className="tour-field">
                    <span className="tour-field-label">Subject Line</span>
                    <input
                      type="text"
                      value={subject}
                      placeholder="Your email subject..."
                      maxLength={200}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </label>
                  <label className="tour-field" style={{ marginTop: 12 }}>
                    <span className="tour-field-label">Message Body</span>
                    <textarea
                      className="press-textarea email-body-textarea"
                      rows={10}
                      value={body}
                      placeholder="Write your message to fans... Plain text is fine — it gets wrapped in the branded template automatically. Paste links and they'll become clickable."
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="email-preview">
                  <div className="email-preview-subject">
                    <strong>Subject:</strong> {subject || '(no subject)'}
                  </div>
                  <div className="email-preview-body">
                    {body ? (
                      body.split('\n').map((line, i) => <p key={i}>{line || <br />}</p>)
                    ) : (
                      <p className="no-activity">Empty message</p>
                    )}
                  </div>
                  <div className="email-preview-footer">
                    Sending to {activeCount} active subscriber{activeCount === 1 ? '' : 's'}
                  </div>
                </div>
              )}

              <div className="email-test-row">
                <input
                  type="email"
                  value={testAddress}
                  placeholder="your@email.com"
                  onChange={(e) => setTestAddress(e.target.value)}
                  aria-label="Test email address"
                />
                <button
                  onClick={handleTest}
                  className="btn btn-secondary"
                  disabled={!canCompose || !testAddress.trim() || busy !== null}
                >
                  {busy === 'test' ? 'Sending...' : 'Send Test'}
                </button>
              </div>

              {!confirming ? (
                <div className="email-actions">
                  <button
                    onClick={() => setConfirming(true)}
                    className="btn btn-primary"
                    disabled={!canCompose || busy !== null || Boolean(inFlight) || activeCount === 0}
                  >
                    <Icons.Megaphone /> Send to {activeCount} Subscribers
                  </button>
                  <button onClick={handleExportCSV} className="btn btn-ghost">
                    <Icons.Download /> Export List (CSV)
                  </button>
                </div>
              ) : (
                <div className="email-confirm">
                  <p className="email-confirm-text">
                    This sends “<strong>{subject}</strong>” to{' '}
                    <strong>
                      {activeCount} real subscriber{activeCount === 1 ? '' : 's'}
                    </strong>
                    . This cannot be undone.
                    {remainingToday !== null && activeCount > remainingToday && (
                      <>
                        {' '}
                        Today&apos;s campaign limit allows {remainingToday}; the rest send
                        automatically over the following days.
                      </>
                    )}
                    {verifyAddress && (
                      <> A copy goes to {verifyAddress} with each daily batch, so you can see every
                        one land.</>
                    )}
                  </p>
                  <div className="email-actions">
                    <button onClick={handleSend} className="btn btn-primary" disabled={busy !== null}>
                      {busy === 'send' ? 'Sending...' : 'Yes, send it'}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="btn btn-ghost"
                      disabled={busy !== null}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {inFlight && (
                <p className="email-hint">
                  A campaign is still sending. You can compose the next one once it finishes.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="email-templates">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Templates</h2>
            </div>
            <div className="panel-body">
              <div className="template-list">
                {TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => handleTemplate(t)} className="template-item">
                    <span className="template-name">{t.name}</span>
                    <span className="template-subject">{t.subject}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h2 className="panel-title">Recent Campaigns</h2>
            </div>
            <div className="panel-body">
              {campaigns.length === 0 ? (
                <p className="no-activity">Nothing sent yet.</p>
              ) : (
                <ul className="campaign-history">
                  {campaigns.slice(0, 6).map((c) => (
                    <li key={c.id} className="campaign-history-item">
                      <button
                        type="button"
                        className="campaign-history-button"
                        onClick={() => setInspectingId(c.id)}
                        title="View recipients"
                      >
                        <span className="campaign-history-subject">{c.subject}</span>
                        <span className="campaign-history-meta">
                          <span className={`campaign-badge campaign-badge-${c.status}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                          {c.sentCount}/{c.totalRecipients} · {formatDate(c.createdAt)}
                        </span>
                      </button>
                      {c.lastError && <span className="campaign-history-error">{c.lastError}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {inspecting && (
        <CampaignRecipientsModal
          campaign={inspecting}
          Icons={Icons}
          onClose={closeInspector}
        />
      )}
    </div>
  );
};

export default EmailPanel;
