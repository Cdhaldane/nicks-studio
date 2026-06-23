import React, { useState, useEffect, useMemo } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const RevenuePanel = ({ Icons }) => {
  const [orders, setOrders] = useState([]);
  const [spotifyStats, setSpotifyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [merchData, spotify] = await Promise.all([
      vercelEmailStorageService.getMerchOrders(50),
      vercelEmailStorageService.getSpotifyStats(),
    ]);
    setOrders(merchData.orders || []);
    setSpotifyStats(spotify);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const allRevenue = orders.reduce((sum, o) => {
      return sum + (o.totalMoney?.amount ? Number(o.totalMoney.amount) / 100 : 0);
    }, 0);

    const last30dOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    const last7dOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);

    const last30dRevenue = last30dOrders.reduce((sum, o) => {
      return sum + (o.totalMoney?.amount ? Number(o.totalMoney.amount) / 100 : 0);
    }, 0);

    const last7dRevenue = last7dOrders.reduce((sum, o) => {
      return sum + (o.totalMoney?.amount ? Number(o.totalMoney.amount) / 100 : 0);
    }, 0);

    // Group by week for chart
    const weeklyData = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
      const weekRevenue = orders
        .filter(o => {
          const d = new Date(o.createdAt);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, o) => sum + (o.totalMoney?.amount ? Number(o.totalMoney.amount) / 100 : 0), 0);
      weeklyData.push({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: weekRevenue,
      });
    }

    return { allRevenue, last30dRevenue, last7dRevenue, weeklyData, totalOrders: orders.length };
  }, [orders]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  const maxWeekly = Math.max(...stats.weeklyData.map(w => w.revenue), 1);

  return (
    <div className="revenue-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-green">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Merch Revenue</span>
            <span className="stat-card-value">${stats.allRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">
            <Icons.BarChart />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Last 30 Days</span>
            <span className="stat-card-value">${stats.last30dRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.Zap />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Last 7 Days</span>
            <span className="stat-card-value">${stats.last7dRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber">
            <Icons.Music />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Spotify Popularity</span>
            <span className="stat-card-value">{spotifyStats?.artist?.popularity || '—'}</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Weekly Revenue (12 Weeks)</h2>
        </div>
        <div className="panel-body">
          {stats.allRevenue > 0 ? (
            <div className="daily-chart">
              {stats.weeklyData.map((week, i) => (
                <div key={i} className="chart-bar-wrapper" title={`${week.label}: $${week.revenue.toFixed(2)}`}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(week.revenue / maxWeekly) * 100}%` }}
                  />
                  <span className="chart-label">{week.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity">No revenue data yet. Complete Square setup to track merch sales.</p>
          )}
        </div>
      </div>

      {/* Revenue Sources Breakdown */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Revenue Sources</h2>
        </div>
        <div className="panel-body">
          <div className="revenue-sources">
            <div className="revenue-source-item">
              <div className="revenue-source-label">
                <span className="revenue-dot" style={{ background: '#34d399' }} />
                Merch Sales (Square)
              </div>
              <span className="revenue-source-value">${stats.allRevenue.toFixed(2)}</span>
            </div>
            <div className="revenue-source-item">
              <div className="revenue-source-label">
                <span className="revenue-dot" style={{ background: '#60a5fa' }} />
                Streaming (estimated)
              </div>
              <span className="revenue-source-value revenue-estimate">
                {spotifyStats?.artist?.followers
                  ? `~$${(spotifyStats.artist.followers * 0.003).toFixed(2)}/mo`
                  : 'Connect Spotify'}
              </span>
            </div>
            <div className="revenue-source-item">
              <div className="revenue-source-label">
                <span className="revenue-dot" style={{ background: '#a78bfa' }} />
                Ticket Sales
              </div>
              <span className="revenue-source-value revenue-estimate">Not tracked yet</span>
            </div>
          </div>
          <p className="section-desc" style={{ marginTop: 12 }}>
            Note: Streaming revenue is estimated based on follower count. Connect additional platforms for accurate tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenuePanel;
