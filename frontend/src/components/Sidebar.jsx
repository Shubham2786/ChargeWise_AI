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
    <div className="fixed left-0 top-0 h-screen w-64 bg-primary-white border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">Grid Optimizer</h1>
        <p className="text-xs text-text-secondary mt-1">AI-Powered Grid Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-button transition-colors ${
                  isActive
                    ? 'bg-primary-bg text-text-primary font-medium'
                    : 'text-text-secondary hover:bg-primary-bg/50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-small">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 rounded-button bg-primary-bg">
          <p className="text-xs font-medium text-text-primary">System Status</p>
          <p className="text-xs text-text-secondary mt-1">All systems operational</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
