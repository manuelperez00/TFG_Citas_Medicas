import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

function getVariant(message) {
  if (typeof message !== 'string') return 'info';
  const t = message.trimStart();
  if (t.startsWith('✅')) return 'success';
  if (t.startsWith('❌')) return 'error';
  if (t.startsWith('⚠️')) return 'warning';
  return 'info';
}

const VARIANTS = {
  success: { icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: '¡Operación exitosa!' },
  error:   { icon: '❌', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Ha ocurrido un error' },
  warning: { icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Aviso' },
  info:    { icon: 'ℹ️', color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe', title: 'Información' },
};

export function ModalProvider({ children }) {
  const [queue, setQueue] = useState([]);

  const push = useCallback((config) =>
    new Promise(resolve =>
      setQueue(prev => [...prev, { ...config, resolve, id: Date.now() + Math.random() }])
    ), []);

  const showAlert   = useCallback((message) => push({ type: 'alert',   message }), [push]);
  const showConfirm = useCallback((message) => push({ type: 'confirm', message }), [push]);

  const handleClose = useCallback((id, result) => {
    setQueue(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal) modal.resolve(result);
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const current = queue[0] || null;

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {current && (
        <ModalUI
          key={current.id}
          id={current.id}
          type={current.type}
          message={current.message}
          onClose={handleClose}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside ModalProvider');
  return ctx;
}

function ModalUI({ id, type, message, onClose }) {
  const variant = getVariant(message);
  const v = VARIANTS[variant];
  const title = type === 'confirm' ? 'Confirmar acción' : v.title;
  const cleanMessage = message.replace(/^(✅|❌|⚠️|☀️)\s*/, '').trim();

  return (
    <div
      className="app-modal-overlay"
      onClick={() => type === 'alert' && onClose(id, undefined)}
    >
      <div
        className="app-modal-card"
        style={{ borderTop: `3px solid ${v.color}` }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: v.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', flexShrink: 0,
          }}>
            {v.icon}
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            {title}
          </h3>
        </div>

        <p style={{
          margin: '0 0 24px 0', color: '#475569', fontSize: '14px',
          lineHeight: '1.65', whiteSpace: 'pre-line',
        }}>
          {cleanMessage}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {type === 'confirm' && (
            <button className="app-modal-btn-cancel" onClick={() => onClose(id, false)}>
              Cancelar
            </button>
          )}
          <button
            className="app-modal-btn-confirm"
            style={{ backgroundColor: v.color }}
            onClick={() => onClose(id, type === 'confirm' ? true : undefined)}
          >
            {type === 'confirm' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
