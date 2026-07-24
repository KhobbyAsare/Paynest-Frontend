/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { customStyles } from './styles';

const posItems = [
  { name: 'House Drip Coffee', price: 'S: 2.50 | M: 3.00 | L: 3.50', basePrice: 3.00 },
  { name: 'Espresso (Double)', price: '3.00', basePrice: 3.00 },
  { name: 'Americano', price: 'S: 3.00 | M: 3.50 | L: 4.00', basePrice: 3.50 },
  { name: 'Latte', price: 'S: 4.00 | M: 4.50 | L: 5.00', basePrice: 4.50 },
  { name: 'Cappuccino', price: 'S: 4.00 | M: 4.50 | L: 5.00', basePrice: 4.50 },
  { name: 'Cold Brew', price: 'M: 4.50 | L: 5.00', basePrice: 4.50 },
  { name: 'Croissant (Butter)', price: '3.50', basePrice: 3.50 },
  { name: 'Muffin (Blueberry)', price: '3.00', basePrice: 3.00 },
];

const PosItem = ({ item, onAdd }: { item: any; onAdd: (item: any) => void }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={hovered ? customStyles.posItemHover : customStyles.posItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onAdd(item)}
    >
      <div style={customStyles.itemName}>{item.name}</div>
      <div style={customStyles.itemPrice}>{item.price}</div>
    </div>
  );
};

export const AttendantView = () => {
  const [cartItems, setCartItems] = useState([
    { label: '1x Latte (M)', amount: 4.50, modifier: { label: '- Oat Milk', amount: 0.50 } },
    { label: '2x Croissant', amount: 7.00, modifier: null },
    { label: '1x Cold Brew (L)', amount: 5.00, modifier: null },
  ]);
  const [skuInput, setSkuInput] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => {
    let total = item.amount;
    if (item.modifier) total += item.modifier.amount;
    return sum + total;
  }, 0);
  const tax = subtotal * 0.085;
  const grandTotal = subtotal + tax;

  const handleAddItem = (item: any) => {
    setCartItems(prev => [...prev, { label: `1x ${item.name}`, amount: item.basePrice, modifier: null }]);
  };

  const handleManualEntry = () => {
    if (skuInput.trim()) {
      setCartItems(prev => [...prev, { label: `1x SKU:${skuInput.trim()}`, amount: 0.00, modifier: null }]);
      setSkuInput('');
    }
  };

  const handlePayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setCartItems([]);
      setPaymentSuccess(false);
    }, 2000);
  };

  return (
    <div>
      <h1 style={customStyles.h1}>Terminal 04</h1>
      <div style={customStyles.subtitle}>Operator: Smith, A.</div>

      <div style={customStyles.statsGrid}>
        {[
          { label: 'Current Shift', value: '04:12:00' },
          { label: 'Shift Sales', value: '$1,240.00' },
          { label: 'Last Transaction', value: '14:28 - $12.50' },
        ].map((stat) => (
          <div key={stat.label} style={customStyles.statBlock}>
            <div style={customStyles.metaLabel}>{stat.label}</div>
            <div style={customStyles.dataValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={customStyles.splitLayout}>
        <div>
          <div style={customStyles.metaLabel}>Quick Add items</div>
          <div style={customStyles.itemGrid}>
            {posItems.map((item) => (
              <PosItem key={item.name} item={item} onAdd={handleAddItem} />
            ))}
          </div>

          <div style={{ marginTop: '32px', marginBottom: '8px' }}>
            <div style={customStyles.metaLabel}>Manual Entry</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter SKU or Barcode"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
              style={customStyles.manualEntryInput}
            />
            <button style={customStyles.manualEntryButton} onClick={handleManualEntry}>ENTER</button>
          </div>
        </div>

        <div style={customStyles.cartPanel}>
          <div style={{ ...customStyles.metaLabel, marginBottom: '24px' }}>Current Order #8892</div>

          <div style={customStyles.cartItems}>
            {cartItems.map((item, i) => (
              <React.Fragment key={i}>
                <div style={customStyles.cartItem}>
                  <span>{item.label}</span>
                  <span>{item.amount.toFixed(2)}</span>
                </div>
                {item.modifier && (
                  <div style={{ ...customStyles.cartItem, ...customStyles.metaLabel, paddingTop: '0', paddingLeft: '16px' }}>
                    <span>{item.modifier.label}</span>
                    <span>{item.modifier.amount.toFixed(2)}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={customStyles.cartTotals}>
            <div style={{ ...customStyles.cartRow, ...customStyles.metaLabel }}>
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ ...customStyles.cartRow, ...customStyles.metaLabel }}>
              <span>Tax (8.5%)</span>
              <span>{tax.toFixed(2)}</span>
            </div>
            <div style={customStyles.cartRowGrandTotal}>
              <span>Total</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            style={{ ...customStyles.btn, opacity: paymentSuccess ? 0.7 : 1 }}
            onClick={handlePayment}
          >
            {paymentSuccess ? 'Payment Processed!' : 'Process Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
