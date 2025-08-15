'use client';

import { useState } from 'react';
import { 
  HelpCircleIcon,
  SearchIcon,
  BookOpenIcon,
  MessageCircleIcon,
  MailIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  expanded: boolean;
}

export default function AdminHelp() {
  const [projects] = useState([
    { id: 1, name: 'Event planning', color: 'bg-pink-400' },
    { id: 2, name: 'Discussions', color: 'bg-green-400' }
  ]);

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: 1,
      question: 'How do I create a new project?',
      answer: 'To create a new project, click on the "New Project" button in the header or go to the Projects page and click the "+" icon. Fill in the project details and click "Create Project".',
      expanded: false
    },
    {
      id: 2,
      question: 'How can I assign tasks to team members?',
      answer: 'You can assign tasks by going to the task details and selecting team members from the "Assigned People" dropdown. You can assign multiple people to a single task.',
      expanded: false
    },
    {
      id: 3,
      question: 'How do I track project progress?',
      answer: 'Project progress can be tracked through the dashboard where you can see completion percentages, task statuses, and timeline updates. Each project has its own progress metrics.',
      expanded: false
    },
    {
      id: 4,
      question: 'Can I export project data?',
      answer: 'Yes, you can export project data in various formats including PDF reports, CSV files, and Excel spreadsheets. Look for the export button in each section.',
      expanded: false
    }
  ]);

  const toggleFAQ = (id: number) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
    ));
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <HelpCircleIcon className="h-6 w-6 text-gray-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, tutorials, or FAQ..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">User Guide</h3>
              </div>
              <p className="text-gray-600">
                Comprehensive documentation and tutorials to help you get started with GrapeTrack.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <MessageCircleIcon className="h-8 w-8 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Live Chat</h3>
              </div>
              <p className="text-gray-600">
                Chat with our support team in real-time for immediate assistance with your questions.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <MailIcon className="h-8 w-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Email Support</h3>
              </div>
              <p className="text-gray-600">
                Send us an email with your questions and we'll get back to you within 24 hours.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                    {faq.expanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {faq.expanded && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-600">support@grapetrack.com</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Support</p>
                  <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
              </p>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send Feedback</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your feedback"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your experience or suggest improvements..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                Send Feedback
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
