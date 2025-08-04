'use client';

import { useState } from 'react';
import { 
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  author: string;
}

export default function AdminDocuments() {
  const [projects] = useState([
    { id: 1, name: 'Event planning', color: 'bg-pink-400' },
    { id: 2, name: 'Discussions', color: 'bg-green-400' }
  ]);

  const [documents] = useState<Document[]>([
    {
      id: 1,
      name: 'Project Requirements.pdf',
      type: 'PDF',
      size: '2.3 MB',
      lastModified: '2 hours ago',
      author: 'John Doe'
    },
    {
      id: 2,
      name: 'Meeting Notes.docx',
      type: 'Word',
      size: '1.1 MB',
      lastModified: '1 day ago',
      author: 'Jane Smith'
    },
    {
      id: 3,
      name: 'Design Mockups.zip',
      type: 'Archive',
      size: '15.7 MB',
      lastModified: '3 days ago',
      author: 'Alex Johnson'
    }
  ]);

  return (
    <AdminLayout activeMenuItem="Documents" projects={projects}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileTextIcon className="h-6 w-6 text-gray-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.lastModified}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <EyeIcon className="h-4 w-4 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <DownloadIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
