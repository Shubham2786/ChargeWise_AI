import React from 'react'

const MetricCard = ({ title, value, subtitle, trend, icon }) => {
  return (
    <div className="bg-primary-white rounded-card p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-small text-text-secondary mb-1">{title}</p>
          <h3 className="text-h2 text-text-primary font-bold">{value}</h3>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-button bg-primary-bg flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-text-secondary">{subtitle}</p>
      )}
      {trend && (
        <div className={`text-xs mt-2 ${trend > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

export default MetricCard
