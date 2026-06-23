import React, { useState, useEffect, useMemo } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const FanMapPanel = ({ Icons }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSubscribers();
    setSubscribers(data);
    setLoading(false);
  };

  const emailDomainStats = useMemo(() => {
    const domains = {};
    subscribers.forEach(s => {
      const domain = s.email.split('@')[1]?.toLowerCase() || 'unknown';
      domains[domain] = (domains[domain] || 0) + 1;
    });
    return Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([domain, count]) => ({ domain, count }));
  }, [subscribers]);

  const sourceStats = useMemo(() => {
    const sources = {};
    subscribers.forEach(s => {
      const src = s.source || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));
  }, [subscribers]);

  const growthData = useMemo(() => {
    if (subscribers.length === 0) return [];
    const sorted = [...subscribers].sort((a, b) =>
      new Date(a.subscribed_at) - new Date(b.subscribed_at)
    );

    // Group by month
    const monthly = {};
    sorted.forEach(s => {
      const date = new Date(s.subscribed_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });

    let cumulative = 0;
    return Object.entries(monthly).map(([month, count]) => {
      cumulative += count;
      return { month, newSubs: count, total: cumulative };
    });
  }, [subscribers]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="empty-state">
        <Icons.Globe />
        <h3>No fan data yet</h3>
        <p>Fan demographics will appear here once you have subscribers.</p>
      </div>
    );
  }

  const maxGrowth = Math.max(...growthData.map(g => g.newSubs), 1);

  return (
    <div className="fan-map-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.Users />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Fans</span>
            <span className="stat-card-value">{subscribers.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">
            <Icons.Globe />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Email Domains</span>
            <span className="stat-card-value">{emailDomainStats.length}+</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-green">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Sources</span>
            <span className="stat-card-value">{sourceStats.length}</span>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      {growthData.length > 1 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Fan Growth Over Time</h2>
          </div>
          <div className="panel-body">
            <div className="daily-chart">
              {growthData.map((point, i) => (
                <div key={i} className="chart-bar-wrapper" title={`${point.month}: +${point.newSubs} (total: ${point.total})`}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(point.newSubs / maxGrowth) * 100}%` }}
                  />
                  <span className="chart-label">{point.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="analytics-two-col">
        {/* Email Domain Distribution */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Email Providers</h2>
          </div>
          <div className="panel-body">
            <div className="analytics-list">
              {emailDomainStats.map((d, i) => (
                <div key={i} className="analytics-list-item">
                  <span className="analytics-list-label">{d.domain}</span>
                  <span className="analytics-list-value">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Source Distribution */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Signup Sources</h2>
          </div>
          <div className="panel-body">
            <div className="analytics-list">
              {sourceStats.map((s, i) => (
                <div key={i} className="analytics-list-item">
                  <span className={`source-badge src-${s.source}`}>{s.source}</span>
                  <span className="analytics-list-value">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fan Heatmap - visual representation */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.Zap /> Activity Heatmap</h2>
        </div>
        <div className="panel-body">
          <div className="heatmap-grid">
            {(() => {
              // Create a 7-day x last-12-weeks heatmap of signups
              const now = new Date();
              const cells = [];
              for (let week = 11; week >= 0; week--) {
                for (let day = 0; day < 7; day++) {
                  const cellDate = new Date(now - (week * 7 + (6 - day)) * 24 * 60 * 60 * 1000);
                  const dateStr = cellDate.toISOString().split('T')[0];
                  const count = subscribers.filter(s => s.subscribed_at?.startsWith(dateStr)).length;
                  cells.push(
                    <div
                      key={`${week}-${day}`}
                      className={`heatmap-cell heatmap-level-${Math.min(count, 4)}`}
                      title={`${dateStr}: ${count} signups`}
                    />
                  );
                }
              }
              return cells;
            })()}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="heatmap-cell heatmap-level-0" />
            <div className="heatmap-cell heatmap-level-1" />
            <div className="heatmap-cell heatmap-level-2" />
            <div className="heatmap-cell heatmap-level-3" />
            <div className="heatmap-cell heatmap-level-4" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanMapPanel;
