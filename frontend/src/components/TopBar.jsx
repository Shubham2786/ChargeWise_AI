import React from 'react'

// In embedded mode, only renders the right-side action icons (notifications, settings, avatar)
// The full TopBar chrome is now rendered directly in App.jsx alongside the HamburgerButton.
const TopBar = ({ embedded = false }) => {
  if (embedded) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="w-9 h-9 rounded-button bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
          🔔
        </button>
        <button className="w-9 h-9 rounded-button bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
          ⚙️
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg">
          A
        </div>
      </div>
    )
  }

  // Standalone fallback (not used in new layout but kept for safety)
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-bg-card/95 backdrop-blur-sm shadow-glass flex items-center justify-between px-4 sm:px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-primary rounded-button flex items-center justify-center text-white font-bold">⚡</div>
        <h1 className="text-base font-bold text-text-primary hidden sm:block">ChargeWise AI</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-button bg-bg-elevated hover:bg-bg-subtle text-text-secondary flex items-center justify-center transition-all">🔔</button>
        <button className="w-9 h-9 rounded-button bg-bg-elevated hover:bg-bg-subtle text-text-secondary flex items-center justify-center transition-all">⚙️</button>
        <div className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold cursor-pointer">A</div>
      </div>
    </div>
  )
}

export default TopBar
