import React from 'react'
import { motion } from 'framer-motion'

export default function HamburgerButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      className="relative z-[200] w-10 h-10 flex flex-col items-center justify-center gap-[5px] focus:outline-none"
    >
      {/* Top line */}
      <motion.span
        animate={isOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        className="block w-6 h-[2px] bg-white origin-center rounded-full"
      />
      {/* Middle line */}
      <motion.span
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="block w-6 h-[2px] bg-white origin-center rounded-full"
      />
      {/* Bottom line */}
      <motion.span
        animate={isOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        className="block w-6 h-[2px] bg-white origin-center rounded-full"
      />
    </button>
  )
}
