import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [orders, setOrders] = useState([
    { id: 'ORD-1001', client: 'PT Sucofindo Cabang Semarang', status: 'TODO', version: 1, technician: 'Budi Santoso' },
    { id: 'ORD-1002', client: 'PLN Unit Induk Jateng', status: 'IN_PROGRESS', version: 2, technician: 'Andi Wijaya' },
  ]);

  const [inventory, setInventory] = useState([
    { id: 'MAT-KAYU', name: 'Kayu Jati', on_hand: 100, reserved: 10, unit: 'kg' },
    { id: 'MAT-BAUT', name: 'Baut Baja', on_hand: 1000, reserved: 16, unit: 'pcs' },
  ]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b192c', color: '#f8fafc', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, color: '#00a86b', fontSize: '24px' }}>SUCOFINDO — Ops Control & TIC</h1>
        <nav style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setActiveTab('landing')} style={btnStyle(activeTab === 'landing')}>Beranda</button>
          <button onClick={() => setActiveTab('orders')} style={btnStyle(activeTab === 'orders')}>Order Tracking</button>
          <button onClick={() => setActiveTab('inventory')} style={btnStyle(activeTab === 'inventory')}>Produksi & Inventori</button>
        </nav>
      </header>

      {activeTab === 'landing' && (
        <div>
          <h2>Sistem Informasi Pemastian Mutu & Operasional</h2>
          <p>Platform terintegrasi untuk Real-Time Order Tracking dan Manajemen Produksi Berbasis BOM (Bill of Materials).</p>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2>Real-Time Order & Job Tracking</h2>
          <ul>
            {orders.map(o => (
              <li key={o.id} style={{ background: '#1e293b', padding: '10px', margin: '10px 0', borderRadius: '6px' }}>
                <strong>{o.id}</strong> - {o.client} [{o.status}] (Teknisi: {o.technician})
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <h2>Manajemen Stok & BOM</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e293b', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>ID</th>
                <th style={{ padding: '8px' }}>Nama Material</th>
                <th style={{ padding: '8px' }}>On Hand</th>
                <th style={{ padding: '8px' }}>Reserved</th>
                <th style={{ padding: '8px' }}>Available</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '8px' }}>{item.id}</td>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ padding: '8px' }}>{item.on_hand} {item.unit}</td>
                  <td style={{ padding: '8px' }}>{item.reserved} {item.unit}</td>
                  <td style={{ padding: '8px', color: '#10b981', fontWeight: 'bold' }}>{item.on_hand - item.reserved} {item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function btnStyle(active) {
  return {
    background: active ? '#00a86b' : 'transparent',
    color: '#fff',
    border: '1px solid #00a86b',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  };
}
