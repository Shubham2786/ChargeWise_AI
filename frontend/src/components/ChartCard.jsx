import React from 'react'

const ChartCard = ({ title, subtitle, children, dark = false, actions }) => {
  return (
    <div className={`rounded-card p-4 sm:p-5 lg:p-6 shadow-glass ${
      dark ? 'glass-dark' : 'bg-bg-card'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h3 className={`text-base sm:text-lg font-semibold break-words ${
            dark ? 'text-text-primary' : 'text-text-primary'
          }`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-xs sm:text-sm mt-1 break-words ${
              dark ? 'text-text-muted' : 'text-text-secondary'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default ChartCard
