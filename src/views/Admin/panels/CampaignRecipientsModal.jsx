import React, { useCallback, useEffect, useMemo, useState } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

/** Rows past this are not painted — the list stays usable at any audience size. */
const MAX_VISIBLE_ROWS = 500;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'pending', label: 'Not yet sent' },
  { key: 'failed', label: 'Failed' },
];

const formatSentAt = (iso) => {
  if (!iso) return 'Sent';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sent';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Flattens the three server lists into one table — mailed addresses first, then
 * failures, then the outstanding queue. A failed address is still held in the
 * queue for retry, so it is listed once, under its failure.
 */
const buildRows = ({ sent, pending, failed }) => {
  const failedEmails = new Set(failed.map((entry) => entry.email));
  return [
    ...sent.map((entry) => ({ email: entry.email, status: 'sent', at: entry.at, error: null })),
    ...failed.map((entry) => ({
      email: entry.email,
      status: 'failed',
      at: null,
      error: entry.error,
    })),
    ...pending
      .filter((email) => !failedEmails.has(email))
      .map((email) => ({ email, status: 'pending', at: null, error: null })),
  ];
};

const toCsv = (rows) => {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [
    'Email,Status,Sent At,Error',
    ...rows.map((r) => [r.email, r.status, r.at || '', r.error || ''].map(escape).join(',')),
  ].join('\n');
};

const CampaignRecipientsModal = ({ campaign, Icons, onClose }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    vercelEmailStorageService.getCampaignRecipients(campaign.id).then((result) => {
      if (cancelled) return;
      if (result.success) setData(result);
      else setError(result.message || 'Could not load recipients.');
    });

    return () => {
      cancelled = true;
    };
  }, [campaign.id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const rows = useMemo(() => (data ? buildRows(data) : []), [data]);

  const counts = useMemo(() => {
    const tally = (status) => rows.filter((row) => row.status === status).length;
    return {
      all: rows.length,
      sent: tally('sent'),
      pending: tally('pending'),
      failed: tally('failed'),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (filter === 'all' || row.status === filter) &&
        (!needle || row.email.toLowerCase().includes(needle))
    );
  }, [rows, filter, query]);

  const visible = filtered.slice(0, MAX_VISIBLE_ROWS);

  const handleExport = useCallback(() => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-recipients-${campaign.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, campaign.id]);

  // Recipients left on a stopped campaign will never be mailed — say so plainly.
  const pendingLabel = campaign.status === 'failed' ? 'Stopped — not sent' : 'Queued';

  const verifications = campaign.verifications || [];

  return (
    <div
      className="recipients-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="recipients-modal" role="dialog" aria-modal="true" aria-label="Campaign recipients">
        <div className="recipients-head">
          <div>
            <h3 className="recipients-title">{campaign.subject}</h3>
            <p className="recipients-subtitle">
              {campaign.sentCount} of {campaign.totalRecipients} sent
              {campaign.pendingCount > 0 && ` · ${campaign.pendingCount} to go`}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            <Icons.X />
          </button>
        </div>

        {error && <div className="toast toast-error">{error}</div>}

        {!data && !error ? (
          <div className="empty-state-inline">
            <div className="loading-spinner" />
          </div>
        ) : null}

        {data && (
          <>
            <div className="recipients-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`recipients-filter${filter === f.key ? ' is-active' : ''}`}
                >
                  {f.label} <span className="recipients-filter-count">{counts[f.key]}</span>
                </button>
              ))}
            </div>

            <div className="recipients-toolbar">
              <input
                type="search"
                value={query}
                placeholder="Search an address..."
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search recipients"
              />
              <button onClick={handleExport} className="btn btn-ghost btn-sm" disabled={filtered.length === 0}>
                <Icons.Download /> CSV
              </button>
            </div>

            {verifications.length > 0 && (
              <div className="recipients-verifications">
                <span className="recipients-verifications-head">
                  Verification copies to {verifications[0].email} — one per daily batch, not
                  counted in the list below
                </span>
                <ul>
                  {verifications.map((copy, i) => (
                    <li key={copy.at || i} className={copy.error ? 'is-error' : undefined}>
                      <span
                        className={`recipients-dot recipients-dot-${copy.error ? 'failed' : 'sent'}`}
                      />
                      Batch {i + 1}
                      {copy.instalmentSize ? ` (${copy.instalmentSize} subscribers)` : ''} ·{' '}
                      {copy.error ? `failed — ${copy.error}` : formatSentAt(copy.at)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!data.sentListComplete && campaign.sentCount > 0 && (
              <p className="recipients-note">
                Addresses for {campaign.sentCount - data.sent.length} of the sent emails are no
                longer stored — only the most recent campaigns keep the full list.
              </p>
            )}

            {filtered.length === 0 ? (
              <p className="no-activity">No addresses match.</p>
            ) : (
              <ul className="recipients-list">
                {visible.map((row) => (
                  <li key={`${row.status}-${row.email}`} className="recipients-row">
                    <span className={`recipients-dot recipients-dot-${row.status}`} />
                    <span className="recipients-email">{row.email}</span>
                    <span className="recipients-status">
                      {row.status === 'sent' && formatSentAt(row.at)}
                      {row.status === 'pending' && pendingLabel}
                      {row.status === 'failed' && (row.error || 'Failed')}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {filtered.length > visible.length && (
              <p className="recipients-note">
                Showing the first {MAX_VISIBLE_ROWS} of {filtered.length}. Search to narrow it down,
                or export the CSV for the full list.
              </p>
            )}

            <p className="recipients-footnote">
              “Sent” means the email was accepted for delivery — it doesn&apos;t confirm it reached
              the inbox.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignRecipientsModal;
