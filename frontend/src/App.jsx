import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Recommendation from './pages/Recommendation'
import Planning from './pages/Planning'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-primary-bg">
        <Sidebar />
        <div className="ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/planning" element={<Planning />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
