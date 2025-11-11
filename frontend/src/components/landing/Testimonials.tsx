import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Engineering Manager',
    company: 'TechCorp',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'GrapeTrack transformed how we manage tasks across multiple client projects. The dynamic role system is a game-changer.',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Product Lead',
    company: 'StartupHub',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: 'Finally, a task manager that adapts to our organization structure instead of forcing us to adapt to it.',
  },
  {
    name: 'Emily Johnson',
    role: 'Operations Director',
    company: 'ScaleWorks',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: 'The multi-organization support is perfect for our agency. We can manage all clients in one place with complete isolation.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            See what teams are saying about GrapeTrack
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-indigo-100" />
              
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
