import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Optimization', path: '/recommendation', icon: '⚡' },
    { name: 'Planning', path: '/planning', icon: '📍' },
  ]

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 sm:w-20 bg-bg-card shadow-glass flex flex-col items-center py-4 sm:py-6 gap-3 sm:gap-4 z-40">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-button flex items-center justify-center text-xl sm:text-2xl transition-all hover-lift min-h-touch min-w-touch ${
              isActive
                ? 'bg-gradient-primary text-white shadow-glass'
                : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
            }`}
            title={item.name}
          >
            {item.icon}
          </Link>
        )
      })}
    </div>
  )
}

export default Sidebar
