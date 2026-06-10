import React, { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#09101f]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)] py-3'
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <span className="text-white font-black text-sm tracking-tight">CT</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Cal<span className="text-teal-400">Tally</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/login')}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log In
            </button>
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all">
              <Zap size={14} fill="currentColor" /> Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d1526] border-t border-white/10 py-4 px-4 flex flex-col gap-4">
          {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/70 hover:text-white px-2">
              {item}
            </a>
          ))}
          <div className="h-px bg-white/10 my-1" />
          <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-teal-400 to-indigo-500 text-white rounded-xl py-3 text-sm font-semibold">
            Get Started Free
          </button>
        </div>
      )}
    </nav>
  );
}
