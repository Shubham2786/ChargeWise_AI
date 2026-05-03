import React from 'react'

const TopBar = ({ title, subtitle }) => {
  return (
    <div className="bg-primary-white border-b border-border px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">{title}</h1>
          {subtitle && <p className="text-small text-text-secondary mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-small text-text-secondary hover:text-text-primary transition-colors">
            Refresh Data
          </button>
          <div className="w-px h-6 bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-dark text-white flex items-center justify-center text-xs font-medium">
              A
            </div>
            <span className="text-small text-text-primary">Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
