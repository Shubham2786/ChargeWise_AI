import React from 'react'

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-primary-white rounded-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-h3 text-text-primary">{title}</h3>
        {subtitle && <p className="text-small text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default ChartCard
