import React from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { name: 'Dashboard',            path: '/',          icon: '📊', desc: 'Executive view' },
  { name: 'Forecasting',          path: '/forecast',  icon: '⚡', desc: 'P10 / P50 / P90' },
  { name: 'Scheduling',           path: '/schedule',  icon: '📅', desc: 'EDF optimization' },
  { name: 'Risk Monitoring',      path: '/risk',      icon: '🛡️', desc: 'Grid overload risk' },
  { name: 'Pricing Intelligence', path: '/pricing',   icon: '💰', desc: 'Dynamic pricing' },
  { name: 'Planning',             path: '/planning',  icon: '📍', desc: 'Infrastructure siting' },
  { name: 'Anomalies',            path: '/anomalies', icon: '🔍', desc: 'Spike detection' },
  { name: 'System Overview',      path: '/system',    icon: '🔮', desc: 'Unified intelligence' },
]

// Stagger each nav item when menu opens
const itemVariants = {
  closed: { x: -20, opacity: 0 },
  open:   (i) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.07 + i * 0.05,
      duration: 0.32,
      ease: [0.25, 0.8, 0.25, 1],
    },
  }),
}

export default function SlidingMenu({ isOpen, onClose }) {
  const location = useLocation()

  return (
    /*
     * SlidingMenu is always mounted in the DOM.
     * On DESKTOP:  parent div in App.jsx has z-index 50; dashboard is z-index 100.
     *              Menu is literally behind the dashboard — no overlay, no transform needed.
     * On MOBILE:   parent div in App.jsx slides the whole menu in via CSS transform.
     *              z-index is 300 so it slides over the dashboard.
     */
    <div
      className="relative w-full h-full select-none"
      style={{
        background: 'linear-gradient(160deg, #0b0e14 0%, #0f1219 55%, #0c1018 100%)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Right-edge glow line (visible on desktop when dashboard slides away) */}
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-full w-px pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 5%, rgba(91,124,250,0.35) 50%, transparent 95%)',
        }}
      />

      {/* Top ambient glow blob */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,124,250,0.08) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* ── Brand ── */}
      <div className="px-7 pt-8 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-lg flex-shrink-0">
            ⚡
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-tight">ChargeWise AI</p>
            <p className="text-white/35 text-xs leading-tight mt-0.5">Grid Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-white/[0.06] mb-3" />

      {/* ── Nav items ── */}
      <nav className="px-3 space-y-0.5 relative z-10">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path
          return (
            <motion.div
              key={item.path}
              custom={i}
              variants={itemVariants}
              initial="closed"
              animate={isOpen ? 'open' : 'closed'}
            >
              <Link
                to={item.path}
                onClick={onClose}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/25 to-indigo-600/15 border border-blue-500/25'
                    : 'border border-transparent hover:bg-white/[0.05]'
                }`}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-blue-400" />
                )}

                <span
                  className={`text-xl w-7 text-center flex-shrink-0 transition-transform duration-200 ${
                    !isActive ? 'group-hover:scale-110' : ''
                  }`}
                >
                  {item.icon}
                </span>

                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={`text-sm font-medium leading-tight ${
                      isActive ? 'text-white' : 'text-white/65 group-hover:text-white/90'
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="text-[11px] text-white/25 group-hover:text-white/35 transition-colors leading-tight mt-0.5">
                    {item.desc}
                  </span>
                </div>

                {/* Active glow dot */}
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-blue-400/50 transition-all flex-shrink-0" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="absolute bottom-6 left-0 right-0 px-7 z-10">
        <div className="h-px bg-white/[0.06] mb-4" />
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
          <p className="text-white/30 text-xs">All systems nominal</p>
        </div>
        <p className="text-white/18 text-xs">v2.0 · 10 Features Active</p>
      </div>
    </div>
  )
}
