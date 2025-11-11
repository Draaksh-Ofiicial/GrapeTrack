import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Multi-Tenant Task Management
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Manage Tasks Across
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {" "}Multiple Organizations
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              GrapeTrack is a powerful task management platform with dynamic role-based access control, 
              seamless organization switching, and real-time collaboration.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/auth/register"
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                    <img
                        key={i}
                        src={`https://avatar.iran.liara.run/public/${i}`}
                        alt={`User ${i}`}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        loading='lazy'
                    />
                ))}
              </div>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">1,000+</span> teams already using GrapeTrack
              </p>
            </div>
          </div>
          
          {/* Right Content - Visual */}
          <div className="relative">
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="space-y-4">
                {/* Mock Dashboard Preview */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <img 
                        src="https://avatar.iran.liara.run/public"
                        alt="Organization A"
                        className="w-10 h-10 rounded-lg"
                        loading='lazy'
                    />
                    <div>
                      <p className="font-semibold">Organization A</p>
                      <p className="text-sm text-gray-500">Admin</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Active
                  </div>
                </div>
                
                <div className="space-y-3">
                  {['Design Homepage', 'Review Pull Request', 'Update Documentation'].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-5 h-5 rounded border-2 border-gray-300" />
                      <span className="text-gray-700">{task}</span>
                      <div className="ml-auto w-8 h-8 rounded-full bg-indigo-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          </div>
        </div>
      </div>
    </section>
  );
}
