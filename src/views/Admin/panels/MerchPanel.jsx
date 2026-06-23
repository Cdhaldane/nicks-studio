import React, { useState, useEffect, useMemo } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const MerchPanel = ({ Icons }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getMerchOrders(30);
    setOrders(data.orders || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => {
      const amount = o.totalMoney?.amount ? Number(o.totalMoney.amount) / 100 : 0;
      return sum + amount;
    }, 0);
    const completedOrders = orders.filter(o => o.state === 'COMPLETED').length;
    const itemsSold = orders.reduce((sum, o) => {
      return sum + (o.lineItems || []).reduce((s, item) => s + Number(item.quantity || 0), 0);
    }, 0);

    // Top selling items
    const itemCounts = {};
    orders.forEach(o => {
      (o.lineItems || []).forEach(item => {
        if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0, revenue: 0 };
        itemCounts[item.name].qty += Number(item.quantity || 0);
        itemCounts[item.name].revenue += item.totalMoney?.amount ? Number(item.totalMoney.amount) / 100 : 0;
      });
    });
    const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return { totalRevenue, completedOrders, itemsSold, topItems };
  }, [orders]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="merch-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-green">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Revenue (90d)</span>
            <span className="stat-card-value">${stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">
            <Icons.BarChart />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Orders</span>
            <span className="stat-card-value">{stats.completedOrders}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.Zap />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Items Sold</span>
            <span className="stat-card-value">{stats.itemsSold}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Avg Order</span>
            <span className="stat-card-value">
              ${orders.length > 0 ? (stats.totalRevenue / orders.length).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-two-col">
        {/* Top Selling Items */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Top Selling Items</h2>
          </div>
          <div className="panel-body">
            {stats.topItems.length > 0 ? (
              <div className="analytics-list">
                {stats.topItems.map((item, i) => (
                  <div key={i} className="analytics-list-item">
                    <span className="analytics-list-label">
                      <span className="merch-rank">{i + 1}.</span> {item.name}
                    </span>
                    <span className="analytics-list-value">{item.qty} sold</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-activity">No sales data yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Recent Orders</h2>
          </div>
          <div className="panel-body">
            {orders.length > 0 ? (
              <div className="analytics-list">
                {orders.slice(0, 8).map((order) => (
                  <div key={order.id} className="analytics-list-item">
                    <div className="order-info">
                      <span className="analytics-list-label">
                        {(order.lineItems || []).map(i => i.name).join(', ') || 'Order'}
                      </span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="analytics-list-value">
                      ${order.totalMoney?.amount ? (Number(order.totalMoney.amount) / 100).toFixed(2) : '0.00'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-activity">No orders yet. Set up Square to start selling merch.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchPanel;
