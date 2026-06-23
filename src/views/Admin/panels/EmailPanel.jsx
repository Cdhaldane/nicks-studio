import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const EmailPanel = ({ Icons }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [sendStatus, setSendStatus] = useState('idle');

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSubscribers();
    setSubscribers(data);
    setLoading(false);
  };

  const handleSendTest = () => {
    setSendStatus('test-sent');
    setTimeout(() => setSendStatus('idle'), 3000);
  };

  const handleExportMailto = () => {
    const emails = subscribers.map(s => s.email).join(',');
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const handleExportCSV = () => {
    const csv = ['Email,Subscribed,Source'];
    subscribers.forEach(s => {
      csv.push(`${s.email},${s.subscribed_at || ''},${s.source || ''}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const templates = [
    { name: 'New Release', subject: '🎵 New Music Out Now!', body: 'Hey there!\n\nI just released new music and wanted you to be the first to hear it.\n\nListen now: [LINK]\n\nThank you for your support!\n\n— Nickola Magnolia' },
    { name: 'Tour Announcement', subject: '🎤 Tour Dates Announced!', body: 'Hey!\n\nI\'m thrilled to announce new tour dates! Check them out and grab your tickets before they sell out.\n\nDates & Tickets: [LINK]\n\nSee you there!\n\n— Nickola Magnolia' },
    { name: 'Merch Drop', subject: '🛍️ New Merch Available', body: 'Hey!\n\nNew merch just dropped in the store. Limited quantities available.\n\nShop now: [LINK]\n\nThanks for repping!\n\n— Nickola Magnolia' },
  ];

  const handleTemplate = (template) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
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
            <span className="stat-card-label">Recipients</span>
            <span className="stat-card-value">{subscribers.length}</span>
          </div>
        </div>
      </div>

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
              {sendStatus === 'test-sent' && (
                <div className="toast toast-success"><Icons.Check /> Test email noted. Use export to send.</div>
              )}

              {!previewMode ? (
                <div className="email-form">
                  <label className="tour-field">
                    <span className="tour-field-label">Subject Line</span>
                    <input
                      type="text"
                      value={subject}
                      placeholder="Your email subject..."
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </label>
                  <label className="tour-field" style={{ marginTop: 12 }}>
                    <span className="tour-field-label">Message Body</span>
                    <textarea
                      className="press-textarea email-body-textarea"
                      rows={10}
                      value={body}
                      placeholder="Write your message to fans..."
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
                    {body ? body.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    )) : <p className="no-activity">Empty message</p>}
                  </div>
                  <div className="email-preview-footer">
                    Sending to {subscribers.length} subscribers
                  </div>
                </div>
              )}

              <div className="email-actions">
                <button onClick={handleExportMailto} className="btn btn-primary" disabled={!subject && !body}>
                  <Icons.ExternalLink /> Open in Email Client
                </button>
                <button onClick={handleExportCSV} className="btn btn-secondary">
                  <Icons.Download /> Export Subscriber List (CSV)
                </button>
                <button onClick={handleSendTest} className="btn btn-ghost">
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="email-templates">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Templates</h2>
            </div>
            <div className="panel-body">
              <div className="template-list">
                {templates.map((t, i) => (
                  <button key={i} onClick={() => handleTemplate(t)} className="template-item">
                    <span className="template-name">{t.name}</span>
                    <span className="template-subject">{t.subject}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPanel;
