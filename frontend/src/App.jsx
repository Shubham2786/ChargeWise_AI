import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Recommendation from './pages/Recommendation'
import Planning from './pages/Planning'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-main">
        <TopBar />
        <Sidebar />
        <div className="ml-16 sm:ml-20 pt-16">
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
