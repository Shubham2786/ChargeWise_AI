import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Recommendation from './pages/Recommendation'
import Planning from './pages/Planning'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex gap-6">
            <Link to="/" className="hover:underline font-semibold">Dashboard</Link>
            <Link to="/recommendation" className="hover:underline font-semibold">Recommendation</Link>
            <Link to="/planning" className="hover:underline font-semibold">Planning</Link>
          </div>
        </nav>
        <div className="container mx-auto p-6">
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
