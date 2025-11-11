import { Building2, Users, Shield, Zap, BarChart3, Bell } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Multi-Organization Support',
    description: 'Seamlessly manage tasks across multiple organizations with one account. Switch contexts instantly.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Dynamic Role-Based Access',
    description: 'Create custom roles per organization. Each user can have different permissions in different orgs.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign tasks, and track progress in real-time with built-in activity logs.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Get instant notifications when tasks are assigned, completed, or commented on.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Role-Specific Dashboards',
    description: 'Tailored dashboards for admins, team leads, and members with relevant insights.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Email notifications for task assignments, deadlines, and important updates.',
    color: 'from-pink-500 to-rose-500',
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage Tasks
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed for modern teams working across multiple organizations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-5`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
