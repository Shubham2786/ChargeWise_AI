import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HamburgerButton from './components/HamburgerButton'
import SlidingMenu from './components/SlidingMenu'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Forecasting from './pages/Forecasting'
import Recommendation from './pages/Recommendation'
import RiskMonitoring from './pages/RiskMonitoring'
import PricingIntelligence from './pages/PricingIntelligence'
import Planning from './pages/Planning'
import AnomalyDetection from './pages/AnomalyDetection'
import HierarchicalForecast from './pages/HierarchicalForecast'
import SystemOverview from './pages/SystemOverview'

const MENU_WIDTH = 260

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/forecast"  element={<Forecasting />} />
          <Route path="/schedule"  element={<Recommendation />} />
          <Route path="/risk"      element={<RiskMonitoring />} />
          <Route path="/pricing"   element={<PricingIntelligence />} />
          <Route path="/planning"  element={<Planning />} />
          <Route path="/anomalies" element={<AnomalyDetection />} />
          <Route path="/hierarchy" element={<HierarchicalForecast />} />
          <Route path="/system"    element={<SystemOverview />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppContent() {
  const [isOpen, setIsOpen]     = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close when switching breakpoints to avoid stuck states
  useEffect(() => { setIsOpen(false) }, [isMobile])

  const toggle = useCallback(() => setIsOpen(o => !o), [])
  const close  = useCallback(() => setIsOpen(false), [])

  const EASE = 'cubic-bezier(0.25,0.8,0.25,1)'
  const DUR  = '0.36s'

  // ── DESKTOP: translateX ONLY — no scale, no width change ────────────────
  // The panel moves right; its intrinsic width (100vw) never changes.
  const desktopPanelStyle = {
    transform:  isOpen ? `translateX(${MENU_WIDTH}px)` : 'translateX(0px)',
    transition: `transform ${DUR} ${EASE}`,
    // NO scale, NO overflow:hidden, NO width change
  }

  // ── MOBILE: dashboard never moves — menu slides over ────────────────────
  const mobilePanelStyle = {
    transform:  'none',
    transition: 'none',
  }

  const panelStyle = isMobile ? mobilePanelStyle : desktopPanelStyle

  // ── MOBILE: menu slides in from the left, over dashboard ────────────────
  const mobileMenuWrapStyle = {
    transform:  isOpen ? 'translateX(0)' : `translateX(-${MENU_WIDTH}px)`,
    transition: `transform ${DUR} ${EASE}`,
  }

  return (
    /*
     * Root — full viewport, NEVER transformed or resized.
     * overflow-x: hidden clips the menu that lives to the left of the viewport
     * on mobile (translateX(-260px) state).
     */
    <div className="min-h-screen" style={{ background: '#080a0f', overflowX: 'hidden' }}>

      {/* ── Ambient glow (decorative only) ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            'radial-gradient(ellipse 55% 65% at 18% 50%, rgba(91,124,250,0.07) 0%, transparent 70%)',
        }}
      />

      {/*
       * ── Menu wrapper ────────────────────────────────────────────────────
       * Desktop: fixed, z-index 50 (behind dashboard panel at z-index 100).
       *          Always visible in DOM; the dashboard slides away to reveal it.
       * Mobile:  fixed, z-index 300 (above dashboard).
       *          Slides in via translateX.
       */}
      <div
        className="fixed left-0 top-0 h-full"
        style={{
          width: MENU_WIDTH,
          zIndex: isMobile ? 300 : 50,
          ...(isMobile ? mobileMenuWrapStyle : {}),
        }}
      >
        <SlidingMenu isOpen={isOpen} onClose={close} />
      </div>

      {/*
       * ── Dashboard panel ─────────────────────────────────────────────────
       * z-index 100 keeps it above the menu on desktop.
       * translateX(260px) on open → slides right to reveal the menu beneath.
       * NO scale. NO overflow:hidden. The panel retains its full 100vw width.
       */}
      <div
        className="relative min-h-screen"
        style={{
          zIndex: 100,
          background: '#0f1115',
          willChange: 'transform',
          ...panelStyle,
        }}
      >
        {/* ── Topbar ── */}
        <header
          className="sticky top-0 left-0 right-0 flex items-center gap-4 px-4 sm:px-5 h-14 sm:h-16"
          style={{
            zIndex: 150,
            background: 'rgba(15,17,21,0.9)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <HamburgerButton isOpen={isOpen} onClick={toggle} />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0">
              ⚡
            </div>
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">
              ChargeWise AI
            </span>
          </div>

          <div className="flex-1 flex justify-end">
            <TopBar embedded />
          </div>
        </header>

        {/* ── Page content — full width, never shrinks ── */}
        <main className="min-h-screen">
          <AnimatedRoutes />
        </main>

        {/*
         * ── Desktop click-trap ───────────────────────────────────────────
         * Thin invisible layer; pointer-events only when menu is open so
         * clicking anywhere on the shifted panel closes the menu.
         * Does NOT use backdrop-filter or opacity blur — those block content.
         */}
        {!isMobile && (
          <div
            aria-hidden="true"
            onClick={close}
            style={{
              position:      'absolute',
              inset:         0,
              zIndex:        140,
              pointerEvents: isOpen ? 'auto' : 'none',
              cursor:        isOpen ? 'pointer' : 'default',
            }}
          />
        )}
      </div>

      {/*
       * ── Mobile dim backdrop ──────────────────────────────────────────────
       * Only renders when mobile menu is open.
       * Sits between menu (z300) and dashboard (z100) visually,
       * but click-closes the menu.
       */}
      {isMobile && isOpen && (
        <div
          aria-hidden="true"
          onClick={close}
          style={{
            position:   'fixed',
            inset:      0,
            zIndex:     290,
            background: 'rgba(0,0,0,0.5)',
            cursor:     'pointer',
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
