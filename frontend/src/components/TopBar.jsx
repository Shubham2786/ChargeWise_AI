import React from 'react'
import { useLocation } from 'react-router-dom'

const TopBar = () => {
  const location = useLocation()
  
  const tabs = [
    { name: 'Dashboard', path: '/' },
    { name: 'Optimization', path: '/recommendation' },
    { name: 'Planning', path: '/planning' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Reports', path: '/reports' },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-bg-card/95 backdrop-blur-sm shadow-glass flex items-center justify-between px-4 sm:px-6 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-button flex items-center justify-center text-white font-bold text-base sm:text-lg">
          ⚡
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base sm:text-lg font-bold text-text-primary">ChargeWise AI</h1>
          <p className="text-xs text-text-muted hidden md:block">EV Load Management</p>
        </div>
      </div>

      {/* Navigation Tabs - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-2">
        {tabs.slice(0, 3).map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <a
              key={tab.path}
              href={tab.path}
              className={`px-3 lg:px-4 py-2 rounded-pill text-xs lg:text-sm font-medium transition-all min-h-touch ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-glass'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              {tab.name}
            </a>
          )
        })}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="w-9 h-9 rounded-button bg-bg-elevated hover:bg-bg-subtle text-text-secondary hover:text-text-primary flex items-center justify-center transition-all min-h-touch min-w-touch">
          🔔
        </button>
        <button className="w-9 h-9 rounded-button bg-bg-elevated hover:bg-bg-subtle text-text-secondary hover:text-text-primary flex items-center justify-center transition-all min-h-touch min-w-touch">
          ⚙️
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold cursor-pointer hover-lift">
          A
        </div>
      </div>
    </div>
  )
}

export default TopBar
