import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Reusable modal shell.
 * Renders children inside a blurred overlay with a close button.
 *
 * @param {boolean}          open
 * @param {() => void}       onClose
 * @param {string}           [title]
 * @param {string}           [subtitle]
 * @param {React.ReactNode}  children
 * @param {string}           [maxWidth]
 */
export default function Modal({ open, onClose, title, subtitle, children, maxWidth = '560px' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#0a0817', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div style={{ padding: '22px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  {title    && <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>{title}</h2>}
                  {subtitle && <p  style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '3px 0 0' }}>{subtitle}</p>}
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
