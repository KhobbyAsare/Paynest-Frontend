import React from 'react';
import { customStyles } from './styles';

export const ManagerView = () => (
  <div>
    <h1 style={customStyles.h1}>Store Operations</h1>
    <div style={customStyles.subtitle}>Location: 042 - Downtown</div>

    <div style={customStyles.statsGrid}>
      {[
        { label: 'Net Sales (Today)', value: '$14,280.50' },
        { label: 'Staff on Clock', value: '12' },
        { label: 'Items Sold', value: '842' },
        { label: 'Avg Transaction Time', value: '00:01:45' },
      ].map((stat) => (
        <div key={stat.label} style={customStyles.statBlock}>
          <div style={customStyles.metaLabel}>{stat.label}</div>
          <div style={customStyles.dataValue}>{stat.value}</div>
        </div>
      ))}
    </div>

    <div style={customStyles.splitLayout}>
      <div>
        <div style={customStyles.metaLabel}>Inventory Alerts</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={customStyles.table}>
            <thead>
              <tr>
                <th style={customStyles.th}>SKU</th>
                <th style={customStyles.th}>Item Name</th>
                <th style={customStyles.thRight}>Current QTY</th>
                <th style={customStyles.thRight}>Reorder Lvl</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sku: '10042', name: 'Espresso Beans (House)', qty: '4.5 kg', reorder: '10 kg', highlight: true },
                { sku: '10089', name: 'Almond Milk (Carton)', qty: '2 units', reorder: '12 units', highlight: true },
                { sku: '20441', name: 'Paper Cups (8oz)', qty: '145 units', reorder: '100 units', highlight: false },
                { sku: '20442', name: 'Lids (8oz)', qty: '120 units', reorder: '100 units', highlight: false },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.sku}</td>
                  <td style={row.highlight ? customStyles.tdHighlight : customStyles.td}>{row.name}</td>
                  <td style={row.highlight ? customStyles.tdRightHighlight : customStyles.tdRight}>{row.qty}</td>
                  <td style={row.highlight ? customStyles.tdRightHighlight : customStyles.tdRight}>{row.reorder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style={customStyles.metaLabel}>Staff Roster (Current Shift)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={customStyles.table}>
            <thead>
              <tr>
                <th style={customStyles.th}>Name</th>
                <th style={customStyles.th}>Role</th>
                <th style={customStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Miller, J.', role: 'Lead', status: 'Clocked In', dotType: 'active' },
                { name: 'Smith, A.', role: 'Register', status: 'Clocked In', dotType: 'active' },
                { name: 'Davis, R.', role: 'Fulfillment', status: 'Break', dotType: 'warning' },
                { name: 'Chen, L.', role: 'Register', status: 'Clocked In', dotType: 'active' },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={customStyles.td}>{row.name}</td>
                  <td style={customStyles.td}>{row.role}</td>
                  <td style={customStyles.td}>
                    <span style={row.dotType === 'active' ? customStyles.statusDotActive : customStyles.statusDotWarning} />
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
