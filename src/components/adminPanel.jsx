// src/components/AdminPanel.jsx
import React from 'react';

export default function AdminPanel() {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>GHC Academy — Admin Panel (Placeholder)</h1>
        <p style={{ color: '#6b7280', marginTop: 6 }}>Temporary admin UI — replace with full admin later.</p>
      </header>

      <section style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
          <strong>Quick actions</strong>
          <div style={{ marginTop: 8 }}>
            <button className="btn-cta" style={{ marginRight: 8 }}>Users</button>
            <button className="btn-cta" style={{ marginRight: 8 }}>Courses</button>
            <button className="btn-cta">Payments</button>
          </div>
        </div>

        <div style={{ padding: 12, borderRadius: 10, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
          <strong>Status</strong>
          <p style={{ margin: '8px 0 0' }}>Local demo mode enabled. Data stored in LocalStorage.</p>
        </div>
      </section>
    </div>
  );
}
