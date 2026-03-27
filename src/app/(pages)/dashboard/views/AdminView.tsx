import React from 'react';
import { customStyles } from './styles';

const barData = [
  { height: '20%', opacity: 0.3 },
  { height: '30%', opacity: 0.5 },
  { height: '45%', opacity: 0.8 },
  { height: '60%', opacity: 1 },
  { height: '50%', opacity: 0.9 },
  { height: '40%', opacity: 0.7 },
  { height: '25%', opacity: 0.4 },
  { height: '35%', opacity: 0.6 },
  { height: '55%', opacity: 0.9 },
  { height: '75%', opacity: 1 },
  { height: '80%', opacity: 1 },
  { height: '65%', opacity: 0.8 },
  { height: '40%', opacity: 0.5 },
  { height: '30%', opacity: 0.4 },
  { height: '45%', opacity: 0.7 },
  { height: '60%', opacity: 0.9 },
  { height: '50%', opacity: 0.8 },
  { height: '35%', opacity: 0.5 },
  { height: '20%', opacity: 0.3 },
  { height: '40%', opacity: 0.6 },
  { height: '70%', opacity: 1 },
  { height: '85%', opacity: 1 },
  { height: '60%', opacity: 0.8 },
  { height: '30%', opacity: 0.4 },
];

export const AdminView = () => (
  <div>
    <h1 style={customStyles.h1}>System Analytics</h1>
    <div style={customStyles.subtitle}>Global Network Overview</div>

    <div style={customStyles.statsGrid}>
      {[
        { label: 'Total Revenue', value: '$1,240,590.00' },
        { label: 'Transactions', value: '48,291' },
        { label: 'Avg Order Value', value: '$25.69' },
        { label: 'System Uptime', value: '99.99%' },
        { label: 'Active Terminals', value: '142 / 150' },
      ].map((stat) => (
        <div key={stat.label} style={customStyles.statBlock}>
          <div style={customStyles.metaLabel}>{stat.label}</div>
          <div style={customStyles.dataValue}>{stat.value}</div>
        </div>
      ))}
    </div>

    <div style={customStyles.dataVisContainer}>
      <div style={customStyles.visHeader}>
        <div style={customStyles.metaLabel}>Transaction Volume (24H)</div>
        <div style={customStyles.metaLabel}>PEAK: 14:00 EST</div>
      </div>
      <div style={{ position: 'relative', paddingBottom: '40px' }}>
        <div style={customStyles.barChartWrapper}>
          {barData.map((bar, i) => (
            <div
              key={i}
              style={{ ...customStyles.bar, height: bar.height, opacity: bar.opacity }}
            />
          ))}
          <div style={customStyles.currentLine} />
          <div style={customStyles.currentLabel}>CURRENT : 14:32</div>
        </div>
      </div>
    </div>

    <div style={customStyles.metaLabel}>Recent Administrative Actions</div>
    <div style={{ overflowX: 'auto' }}>
      <table style={customStyles.table}>
        <thead>
          <tr>
            <th style={customStyles.th}>Timestamp</th>
            <th style={customStyles.th}>User</th>
            <th style={customStyles.th}>Action</th>
            <th style={customStyles.th}>Target</th>
            <th style={customStyles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            { time: '14:28:01', user: 'SYS_ADMIN_01', action: 'MENU_UPDATE', target: 'REGION_EAST', status: 'SUCCESS', highlight: false },
            { time: '14:15:44', user: 'SYS_ADMIN_02', action: 'PRICE_ADJUST', target: 'SKU_8992', status: 'SUCCESS', highlight: false },
            { time: '13:59:12', user: 'AUTO_MAINT', action: 'DB_SYNC', target: 'NODE_04', status: 'FAILED', highlight: true },
            { time: '13:45:00', user: 'SYS_ADMIN_01', action: 'PERM_GRANT', target: 'USER_882', status: 'SUCCESS', highlight: false },
          ].map((row, i) => (
            <tr key={i}>
              <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.time}</td>
              <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.user}</td>
              <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.action}</td>
              <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.target}</td>
              <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
