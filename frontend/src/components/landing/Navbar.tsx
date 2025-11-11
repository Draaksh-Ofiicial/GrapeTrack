import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              GrapeTrack
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Testimonials
            </a>
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Docs
            </a>
          </div>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/auth/login"
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/auth/register"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-gray-700 hover:text-indigo-600 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-indigo-600 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-indigo-600 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-indigo-600 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Docs
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                <Link 
                  to="/auth/login"
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors text-left"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth/register"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
