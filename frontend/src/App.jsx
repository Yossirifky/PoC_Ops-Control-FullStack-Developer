import React, { useState } from 'react';
import { 
  Building2, Package, Activity, ArrowRight, Play, 
  CheckCircle2, Clock, XCircle, AlertTriangle, 
  Layers, Plus, X, Check, ShieldCheck, FileCheck, Search,
  Award, TrendingUp, Cpu, Database, Compass
} from 'lucide-react';

// ==========================================
// MOCK INITIAL DATABASE DATA (LOGIKA TETAP SAMA KONSISTEN)
// ==========================================
const INITIAL_DB = {
  orders: [
    {
      id: "ORD-1001",
      client_name: "Inspeksi PT Sucofindo - Site Project A",
      status: "TODO",
      version: 1,
      technician: "Budi Santoso (Auditor)",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      events: [
        {
          id: 1,
          from_status: "-",
          to_status: "TODO",
          actor: "admin-demo",
          version: 1,
          idempotency_key: "init-1001",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ]
    },
    {
      id: "ORD-1002",
      client_name: "Audit Sertifikasi SNI & K3 Plant B",
      status: "IN_PROGRESS",
      version: 2,
      technician: "Siti Rahma (Lead Inspector)",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      events: [
        {
          id: 2,
          from_status: "-",
          to_status: "TODO",
          actor: "admin-demo",
          version: 1,
          idempotency_key: "init-1002-1",
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: 3,
          from_status: "TODO",
          to_status: "IN_PROGRESS",
          actor: "admin-demo",
          version: 2,
          idempotency_key: "init-1002-2",
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ]
    }
  ],
  materials: {
    "MAT-KAYU": { id: "MAT-KAYU", name: "Kayu Jati Sertifikasi Grade A", on_hand: 100, reserved: 0, base_unit: "kg" },
    "MAT-BAUT": { id: "MAT-BAUT", name: "Baut High-Tensile Stainless", on_hand: 1000, reserved: 0, base_unit: "pcs" },
    "MAT-CAT": { id: "MAT-CAT", name: "Cat Eco Protective Coat", on_hand: 40, reserved: 0, base_unit: "liter" }
  },
  products: {
    "PRD-MEJA": { id: "PRD-MEJA", sku: "SKU-MEJA-01", name: "Meja Jati Standar Sertifikasi", on_hand: 10, reserved: 0, base_unit: "pcs" },
    "PRD-KURSI": { id: "PRD-KURSI", sku: "SKU-KURSI-01", name: "Kursi Ergonomis Inspeksi", on_hand: 18, reserved: 0, base_unit: "pcs" }
  },
  boms: {
    "PRD-MEJA": {
      version: 1,
      items: [
        { material_id: "MAT-KAYU", quantity: 5, unit: "kg" },
        { material_id: "MAT-BAUT", quantity: 8, unit: "pcs" },
        { material_id: "MAT-CAT", quantity: 0.25, unit: "liter" }
      ]
    },
    "PRD-KURSI": {
      version: 1,
      items: [
        { material_id: "MAT-KAYU", quantity: 2.5, unit: "kg" },
        { material_id: "MAT-BAUT", quantity: 6, unit: "pcs" }
      ]
    }
  },
  work_orders: [
    {
      id: "WO-2024-001",
      product_id: "PRD-MEJA",
      product_name: "Meja Jati Standar Sertifikasi",
      quantity: 2,
      status: "RESERVED",
      bom_version: 1,
      bom_snapshot: [
        { material_id: "MAT-KAYU", material_name: "Kayu Jati Sertifikasi Grade A", quantity_per_unit: 5, total_required: 10, unit: "kg" },
        { material_id: "MAT-BAUT", material_name: "Baut High-Tensile Stainless", quantity_per_unit: 8, total_required: 16, unit: "pcs" },
        { material_id: "MAT-CAT", material_name: "Cat Eco Protective Coat", quantity_per_unit: 0.25, total_required: 0.5, unit: "liter" }
      ],
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      idempotency_key: "wo-sample-1"
    }
  ]
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'orders', 'production'
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Database State (Simulated Backend SQLite Engine)
  const [db, setDb] = useState(() => {
    const initialMaterials = JSON.parse(JSON.stringify(INITIAL_DB.materials));
    INITIAL_DB.work_orders.forEach(wo => {
      if (wo.status === 'RESERVED') {
        wo.bom_snapshot.forEach(req => {
          if (initialMaterials[req.material_id]) {
            initialMaterials[req.material_id].reserved += req.total_required;
          }
        });
      }
    });
    return { ...INITIAL_DB, materials: initialMaterials };
  });

  // SSE Stream Simulation
  const [sseConnected, setSseConnected] = useState(true);
  const [lastEventId, setLastEventId] = useState(3);
  const [sseLogs, setSseLogs] = useState([]);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showNotification = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const emitSSEEvent = (type, data) => {
    const newId = lastEventId + 1;
    setLastEventId(newId);
    const eventObj = { id: newId, type, timestamp: new Date().toLocaleTimeString(), data };
    setSseLogs(prev => [eventObj, ...prev.slice(0, 15)]);
  };

  // Case 1 State & Logic
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderTech, setNewOrderTech] = useState('');

  const createOrder = (e) => {
    e.preventDefault();
    if (!newOrderClient.trim()) return;

    const newId = `ORD-${1000 + db.orders.length + 1}`;
    const newOrd = {
      id: newId,
      client_name: newOrderClient,
      technician: newOrderTech || 'Unassigned Inspector',
      status: 'TODO',
      version: 1,
      created_at: new Date().toISOString(),
      events: [
        {
          id: Date.now(),
          from_status: '-',
          to_status: 'TODO',
          actor: 'admin-demo',
          version: 1,
          idempotency_key: `create-${Date.now()}`,
          created_at: new Date().toISOString()
        }
      ]
    };

    setDb(prev => ({ ...prev, orders: [newOrd, ...prev.orders] }));
    setNewOrderClient('');
    setNewOrderTech('');
    showNotification(`Order ${newId} berhasil dibuat!`, 'success');
    emitSSEEvent('ORDER_CREATED', { orderId: newId, status: 'TODO' });
  };

  const updateOrderStatus = (orderId, targetStatus, expectedVersion, idempotencyKey) => {
    const targetOrder = db.orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (targetOrder.status === 'DONE' || targetOrder.status === 'CANCELLED') {
      showNotification(`Order ${orderId} sudah berstatus final (${targetOrder.status})!`, 'error');
      return;
    }

    if (targetOrder.version !== expectedVersion) {
      showNotification(`Optimistic Lock Conflict! Version mismatch: Expected v${expectedVersion}, Actual v${targetOrder.version}`, 'error');
      return;
    }

    const validTransitions = {
      'TODO': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['DONE', 'CANCELLED'],
      'DONE': [],
      'CANCELLED': []
    };

    if (!validTransitions[targetOrder.status].includes(targetStatus)) {
      showNotification(`Transisi status tidak sah dari ${targetOrder.status} ke ${targetStatus}`, 'error');
      return;
    }

    const newVersion = targetOrder.version + 1;
    const newEvent = {
      id: Date.now(),
      from_status: targetOrder.status,
      to_status: targetStatus,
      actor: 'admin-demo',
      version: newVersion,
      idempotency_key: idempotencyKey || `key-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: targetStatus,
            version: newVersion,
            events: [newEvent, ...o.events]
          };
        }
        return o;
      })
    }));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({
        ...prev,
        status: targetStatus,
        version: newVersion,
        events: [newEvent, ...prev.events]
      }));
    }

    showNotification(`Order ${orderId} diperbarui ke ${targetStatus} (v${newVersion})`, 'success');
    emitSSEEvent('ORDER_STATUS_UPDATED', { orderId, from: targetOrder.status, to: targetStatus, version: newVersion });
  };

  // Case 2 State & Logic
  const [selectedProductId, setSelectedProductId] = useState('PRD-MEJA');
  const [woQuantity, setWoQuantity] = useState(2);

  const getBomExplosion = (productId, qty) => {
    const bom = db.boms[productId];
    if (!bom) return [];
    return bom.items.map(item => {
      const mat = db.materials[item.material_id];
      const required = item.quantity * qty;
      const available = mat.on_hand - mat.reserved;
      return {
        material_id: item.material_id,
        material_name: mat.name,
        unit: item.unit,
        per_unit: item.quantity,
        total_required: required,
        on_hand: mat.on_hand,
        reserved: mat.reserved,
        available: available,
        sufficient: available >= required
      };
    });
  };

  const createWorkOrder = () => {
    const explosion = getBomExplosion(selectedProductId, woQuantity);
    const insufficient = explosion.filter(e => !e.sufficient);

    if (insufficient.length > 0) {
      showNotification(`Gagal membuat WO! Stok bahan kurang: ${insufficient.map(i => i.material_name).join(', ')}`, 'error');
      return;
    }

    const newWoId = `WO-2024-${String(db.work_orders.length + 1).padStart(3, '0')}`;
    const product = db.products[selectedProductId];

    const updatedMaterials = { ...db.materials };
    explosion.forEach(req => {
      updatedMaterials[req.material_id] = {
        ...updatedMaterials[req.material_id],
        reserved: updatedMaterials[req.material_id].reserved + req.total_required
      };
    });

    const newWO = {
      id: newWoId,
      product_id: selectedProductId,
      product_name: product.name,
      quantity: Number(woQuantity),
      status: 'RESERVED',
      bom_version: db.boms[selectedProductId].version,
      bom_snapshot: explosion.map(e => ({
        material_id: e.material_id,
        material_name: e.material_name,
        quantity_per_unit: e.per_unit,
        total_required: e.total_required,
        unit: e.unit
      })),
      created_at: new Date().toISOString(),
      idempotency_key: `wo-create-${Date.now()}`
    };

    setDb(prev => ({
      ...prev,
      materials: updatedMaterials,
      work_orders: [newWO, ...prev.work_orders]
    }));

    showNotification(`Work Order ${newWoId} berhasil dibuat & reserved!`, 'success');
    emitSSEEvent('WO_RESERVED', { woId: newWoId, product: product.name, qty: woQuantity });
  };

  const completeWorkOrder = (woId) => {
    const wo = db.work_orders.find(w => w.id === woId);
    if (!wo || wo.status !== 'RESERVED') return;

    const updatedMaterials = { ...db.materials };
    wo.bom_snapshot.forEach(req => {
      const mat = updatedMaterials[req.material_id];
      updatedMaterials[req.material_id] = {
        ...mat,
        on_hand: mat.on_hand - req.total_required,
        reserved: mat.reserved - req.total_required
      };
    });

    const updatedProducts = { ...db.products };
    const prd = updatedProducts[wo.product_id];
    updatedProducts[wo.product_id] = {
      ...prd,
      on_hand: prd.on_hand + wo.quantity
    };

    setDb(prev => ({
      ...prev,
      materials: updatedMaterials,
      products: updatedProducts,
      work_orders: prev.work_orders.map(w => w.id === woId ? { ...w, status: 'DONE' } : w)
    }));

    showNotification(`WO ${woId} Selesai! Stok dipotong & produk bertambah +${wo.quantity}`, 'success');
    emitSSEEvent('WO_COMPLETED', { woId, product: prd.name, qty: wo.quantity });
  };

  const cancelWorkOrder = (woId) => {
    const wo = db.work_orders.find(w => w.id === woId);
    if (!wo || wo.status !== 'RESERVED') return;

    const updatedMaterials = { ...db.materials };
    wo.bom_snapshot.forEach(req => {
      const mat = updatedMaterials[req.material_id];
      updatedMaterials[req.material_id] = {
        ...mat,
        reserved: mat.reserved - req.total_required
      };
    });

    setDb(prev => ({
      ...prev,
      materials: updatedMaterials,
      work_orders: prev.work_orders.map(w => w.id === woId ? { ...w, status: 'CANCELLED' } : w)
    }));

    showNotification(`WO ${woId} Dibatalkan! Reserve dilepaskan.`, 'info');
    emitSSEEvent('WO_CANCELLED', { woId });
  };

  return (
    <div className="min-h-screen bg-[#070F1B] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* TOAST NOTIFICATION MODERN */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' :
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
          'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}>
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'info' && <Clock className="w-5 h-5 text-sky-400" />}
          <span className="text-xs font-semibold tracking-wide">{toast.msg}</span>
        </div>
      )}

      {/* TOP BAR BRANDING PT SUCOFINDO */}
      <header className="sticky top-0 z-40 bg-[#0B192C]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* BRANDING SUCOFINDO */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-wider text-white">SUCOFINDO</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    OPS CONTROL
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-tight">Assurance, Inspection & Certification</span>
              </div>
            </div>

            {/* TAB SELECTOR KORPORAT MODERN */}
            <nav className="flex items-center gap-2 bg-[#060D17] p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('landing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all ${
                  activeTab === 'landing' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Portal Sucofindo
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'orders' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Case 1: Tracking Status
              </button>
              <button
                onClick={() => setActiveTab('production')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'production' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Case 2: Produksi BOM
              </button>
            </nav>

            {/* SSE STATUS INDICATOR */}
            <div 
              onClick={() => setSseConnected(!sseConnected)}
              title="Simulasi toggle SSE Connection"
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono border transition-all ${
                sseConnected 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' 
                  : 'bg-red-950/50 border-red-500/40 text-red-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className="font-bold">{sseConnected ? 'SSE LIVE ACTIVE' : 'SSE DISCONNECTED'}</span>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN SYSTEM CONTAINER */}
      <main>
        {activeTab === 'landing' && (
          <SucofindoLanding 
            isVideoOpen={isVideoOpen}
            setIsVideoOpen={setIsVideoOpen}
            onOpenOpsApp={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'orders' && (
          <OrderTrackingSection 
            db={db}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            newOrderClient={newOrderClient}
            setNewOrderClient={setNewOrderClient}
            newOrderTech={newOrderTech}
            setNewOrderTech={setNewOrderTech}
            createOrder={createOrder}
            updateOrderStatus={updateOrderStatus}
            sseLogs={sseLogs}
          />
        )}

        {activeTab === 'production' && (
          <ProductionSection 
            db={db}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            woQuantity={woQuantity}
            setWoQuantity={setWoQuantity}
            getBomExplosion={getBomExplosion}
            createWorkOrder={createWorkOrder}
            completeWorkOrder={completeWorkOrder}
            cancelWorkOrder={cancelWorkOrder}
          />
        )}
      </main>

      {/* FOOTER KORPORAT */}
      <footer className="bg-[#040A12] border-t border-slate-800/80 py-10 px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-white text-sm">PT SUCOFINDO (PERSERO)</span>
              <p className="text-[11px] text-slate-500">Official Proof of Concept — Digital Production & Order Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>Golang REST & SSE</span>
            <span>•</span>
            <span>SQLite Replay Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// LANDING PAGE: SUCOFINDO MODERN CORPORATE PORTAL
// ============================================================================
function SucofindoLanding({ isVideoOpen, setIsVideoOpen, onOpenOpsApp }) {
  return (
    <div className="bg-[#070F1B] text-slate-100 font-sans">
      
      {/* HERO SECTION MODERN INDUSTRIAL ART */}
      <section className="relative py-28 px-6 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#070F1B] to-[#070F1B]" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-8">
            <Award className="w-3.5 h-3.5" />
            <span>Sistem Pemastian Mutu & Digitalisasi Operasional</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-8">
            Terpercaya Dalam <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Pemastian Mutu & Real-Time Ops</span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed mb-10">
            Platform Terpadu PT Sucofindo menggabungkan pelacakan inspeksi lapangan secara *real-time* serta manajemen persediaan dan produksi berbasis Bill of Materials (BOM) presisi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onOpenOpsApp}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold tracking-wide uppercase text-xs rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-3"
            >
              <span>Jalankan Sistem Ops Control</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsVideoOpen(true)}
              className="px-8 py-4 bg-slate-900 text-slate-200 border border-slate-700 font-semibold tracking-wide uppercase text-xs rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-200" />
              <span>Lihat Demo Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* THREE LAYERS OF SUCOFINDO SERVICES */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">LAYANAN UTAMA</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Testing, Inspection & Certification</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#0B192C] p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Inspeksi & Audit Real-Time</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pelacakan penugasan auditor di lapangan secara langsung dengan mekanisme pembaruan SSE tanpa jeda dan histori transisi status tervalidasi.
            </p>
          </div>

          <div className="bg-[#0B192C] p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Kontrol Produksi BOM</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Simulasi alokasi bahan baku (On Hand, Reserved, Available) secara terintegrasi dengan Snapshot BOM untuk menjamin integritas mutu barang jadi.
            </p>
          </div>

          <div className="bg-[#0B192C] p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Integritas & Sertifikasi</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Menerapkan locking konsistensi data (Optimistic Version Control & Idempotency Key) untuk mencegah risiko oversell atau konflik pembaruan data.
            </p>
          </div>
        </div>
      </section>

      {/* VIDEO DEMO MODAL */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 max-w-2xl w-full p-6 rounded-3xl relative text-white">
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold mb-4">Video Overview Sistem Ops Control Sucofindo</h3>
            <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 border border-slate-800 text-center">
              <Play className="w-12 h-12 text-emerald-400 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-slate-300">Simulasi Pemutaran Video Presentasi Demo PoC...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CASE 1: REAL-TIME ORDER TRACKING (TEMA SUCOFINDO)
// ============================================================================
function OrderTrackingSection({ 
  db, selectedOrder, setSelectedOrder, 
  newOrderClient, setNewOrderClient, 
  newOrderTech, setNewOrderTech, 
  createOrder, updateOrderStatus,
  sseLogs
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-400">Case Study 1</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">Real-Time Order & Inspection Tracking</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pelacakan status pekerjaan auditor Sucofindo dengan SSE, Optimistic Locking (<code className="text-emerald-300 font-mono">expected_version</code>), dan Audit Timeline.
          </p>
        </div>

        {/* FORM MEMBUAT ORDER */}
        <form onSubmit={createOrder} className="flex items-center gap-2 bg-[#0B192C] p-2.5 rounded-2xl border border-slate-800">
          <input 
            type="text" 
            placeholder="Klien / Nama Site..."
            value={newOrderClient}
            onChange={e => setNewOrderClient(e.target.value)}
            className="bg-[#060D17] text-xs px-4 py-2.5 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
          />
          <input 
            type="text" 
            placeholder="Auditor/Teknisi..."
            value={newOrderTech}
            onChange={e => setNewOrderTech(e.target.value)}
            className="bg-[#060D17] text-xs px-4 py-2.5 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-40 hidden sm:block"
          />
          <button 
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Order</span>
          </button>
        </form>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* DAFTAR ORDER */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Order Aktif ({db.orders.length})</span>
            <span className="text-[11px] text-slate-500">Klik card order untuk inspeksi timeline</span>
          </div>

          <div className="space-y-3">
            {db.orders.map(ord => {
              const isSelected = selectedOrder && selectedOrder.id === ord.id;
              return (
                <div 
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#0F223D] border-emerald-500 ring-1 ring-emerald-500 shadow-xl' 
                      : 'bg-[#0B192C] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-emerald-400">{ord.id}</span>
                        <StatusBadge status={ord.status} />
                        <span className="text-[10px] font-mono text-slate-400 bg-[#060D17] px-2 py-0.5 rounded-md border border-slate-800">
                          v{ord.version}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-3">{ord.client_name}</h4>
                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
                        <span>Inspector: <strong className="text-slate-200">{ord.technician}</strong></span>
                        <span>•</span>
                        <span>{new Date(ord.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* CONTROL ACTIONS */}
                    <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {ord.status === 'TODO' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'IN_PROGRESS', ord.version, `idemp-progress-${Date.now()}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
                        >
                          Proses
                        </button>
                      )}

                      {ord.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'DONE', ord.version, `idemp-done-${Date.now()}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                        >
                          Selesaikan
                        </button>
                      )}

                      {(ord.status === 'TODO' || ord.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'CANCELLED', ord.version, `idemp-cancel-${Date.now()}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AUDIT TIMELINE & SSE PANEL */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* TIMELINE AUDIT TRAIL */}
          <div className="bg-[#0B192C] p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">Audit Trail Events</span>
              {selectedOrder && (
                <span className="font-mono text-xs text-emerald-400 font-bold">{selectedOrder.id}</span>
              )}
            </div>

            {selectedOrder ? (
              <div className="space-y-4">
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedOrder.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />
                      <div className="bg-[#060D17] p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>{evt.from_status} → <strong className="text-emerald-400">{evt.to_status}</strong></span>
                          <span className="font-mono text-slate-500">v{evt.version}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                          <span>Actor: {evt.actor}</span>
                          <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Pilih order untuk memuat histori audit trail
              </div>
            )}
          </div>

          {/* SSE BROADCAST STREAM */}
          <div className="bg-[#0B192C] p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">SSE Live Stream</span>
              <span className="text-[10px] font-mono text-slate-500">GET /api/orders/stream</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto font-mono text-[11px]">
              {sseLogs.length > 0 ? (
                sseLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-[#060D17] rounded-xl border border-slate-800 text-slate-300">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="text-emerald-400 font-bold">id:{log.id} [{log.type}]</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="truncate text-slate-400">{JSON.stringify(log.data)}</div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-600 text-xs font-mono">
                  Menunggu siaran event real-time...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'TODO': 'bg-slate-800 text-slate-300 border-slate-700',
    'IN_PROGRESS': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'DONE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'CANCELLED': 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  const labels = {
    'TODO': 'Menunggu',
    'IN_PROGRESS': 'Dikerjakan',
    'DONE': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${styles[status] || styles['TODO']}`}>
      {labels[status] || status}
    </span>
  );
}

// ============================================================================
// CASE 2: PRODUKSI & INVENTORI BOM (TEMA SUCOFINDO)
// ============================================================================
function ProductionSection({ 
  db, selectedProductId, setSelectedProductId, 
  woQuantity, setWoQuantity, getBomExplosion, 
  createWorkOrder, completeWorkOrder, cancelWorkOrder 
}) {
  const selectedProduct = db.products[selectedProductId];
  const bomExplosion = getBomExplosion(selectedProductId, woQuantity);
  const canReserve = bomExplosion.every(item => item.sufficient);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-400">Case Study 2</span>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">Digitalisasi Produksi & Inventori BOM</h2>
        <p className="text-xs text-slate-400 mt-1">
          Kuantitas stok dipisahkan secara transaksional antara <strong className="text-white">On Hand</strong>, <strong className="text-emerald-400">Reserved</strong>, dan <strong className="text-cyan-400">Available</strong>.
        </p>
      </div>

      {/* RINGKASAN MATERIAL & FINISHED GOODS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* STOK BAHAN BAKU */}
        <div className="bg-[#0B192C] p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Stok Bahan Baku (Materials)</span>
            </h3>
            <span className="text-[11px] text-slate-500">Master Data</span>
          </div>

          <div className="space-y-3">
            {Object.values(db.materials).map(mat => {
              const available = mat.on_hand - mat.reserved;
              return (
                <div key={mat.id} className="p-4 bg-[#060D17] rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{mat.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{mat.id}</div>
                  </div>

                  <div className="flex items-center gap-6 text-right font-mono">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">On Hand</div>
                      <div className="text-xs font-bold text-slate-300">{mat.on_hand} {mat.base_unit}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-amber-400 uppercase">Reserved</div>
                      <div className="text-xs font-bold text-amber-400">{mat.reserved} {mat.base_unit}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-emerald-400 uppercase">Available</div>
                      <div className={`text-xs font-bold ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {available} {mat.base_unit}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STOK PRODUK JADI */}
        <div className="bg-[#0B192C] p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-400" />
              <span>Stok Produk Jadi (Finished Goods)</span>
            </h3>
            <span className="text-[11px] text-slate-500">Master Products</span>
          </div>

          <div className="space-y-3">
            {Object.values(db.products).map(prd => (
              <div key={prd.id} className="p-4 bg-[#060D17] rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{prd.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{prd.sku} ({prd.id})</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[9px] text-slate-500 uppercase">Siap Kirim</div>
                  <div className="text-base font-extrabold text-teal-400">{prd.on_hand} {prd.base_unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PEKERJAAN WORK ORDER & BOM PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PREVIEW BOM & BUAT WO */}
        <div className="lg:col-span-6 bg-[#0B192C] p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Buat Work Order Baru</h3>
            <p className="text-xs text-slate-400 mt-1">Preview kebutuhan BOM sebelum melakukan reservation stok.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Produk Target</label>
              <select 
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full bg-[#060D17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.values(db.products).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Jumlah Produksi (Qty)</label>
              <input 
                type="number" 
                min="1"
                value={woQuantity}
                onChange={e => setWoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#060D17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* TABLE BOM EXPLOSION */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300">Preview Kebutuhan Material (BOM v{db.boms[selectedProductId]?.version}):</span>
            
            <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#060D17] text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Material</th>
                    <th className="p-3">Dibutuhkan</th>
                    <th className="p-3">Tersedia</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0B192C]">
                  {bomExplosion.map((item) => (
                    <tr key={item.material_id}>
                      <td className="p-3 font-medium text-white">{item.material_name}</td>
                      <td className="p-3 font-mono text-amber-400">{item.total_required} {item.unit}</td>
                      <td className="p-3 font-mono text-slate-300">{item.available} {item.unit}</td>
                      <td className="p-3 text-right font-bold">
                        {item.sufficient ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Cukup
                          </span>
                        ) : (
                          <span className="text-red-400 inline-flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Kurang
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={createWorkOrder}
            disabled={!canReserve}
            className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              canReserve 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:scale-[1.02] shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Work Order & Reserve Stok</span>
          </button>
        </div>

        {/* MONITOR EKSEKUSI WO */}
        <div className="lg:col-span-6 bg-[#0B192C] p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Daftar Work Orders ({db.work_orders.length})</h3>
            <span className="text-xs text-slate-500">Eksekusi Transaksional</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {db.work_orders.map(wo => (
              <div key={wo.id} className="p-5 bg-[#060D17] rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-400">{wo.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        wo.status === 'RESERVED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        wo.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">{wo.product_name}</h4>
                    <p className="text-xs text-slate-400">Target Produksi: <strong className="text-white font-mono">{wo.quantity} unit</strong> (BOM v{wo.bom_version})</p>
                  </div>

                  {/* EKSEKUSI AKSI */}
                  {wo.status === 'RESERVED' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => completeWorkOrder(wo.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesaikan</span>
                      </button>
                      <button
                        onClick={() => cancelWorkOrder(wo.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Batalkan</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* SNAPSHOT RESEP TERKUNCI */}
                <div className="bg-[#0B192C] p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">BOM Snapshot Terkunci:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {wo.bom_snapshot.map((snap, idx) => (
                      <div key={idx} className="bg-[#060D17] p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-300 font-medium truncate">{snap.material_name}</div>
                        <div className="text-emerald-400 font-mono font-bold text-xs mt-0.5">{snap.total_required} {snap.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}