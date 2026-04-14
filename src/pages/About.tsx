import React from 'react';
import { Shield, Users, TrendingUp, Award, Globe, Clock, CheckCircle, Star, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About: React.FC = () => {
  const stats = [
    { label: 'Active Users', value: '15,234+', icon: Users, color: 'text-purple-300' },
    { label: 'Tasks Completed', value: '2.1M+', icon: CheckCircle, color: 'text-green-300' },
    { label: 'Total Paid', value: '$8.5M+', icon: TrendingUp, color: 'text-blue-300' },
    { label: 'Satisfaction Rate', value: '98.5%', icon: Star, color: 'text-yellow-300' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Bank-level security with SSL encryption and regular audits'
    },
    {
      icon: Target,
      title: 'Verified Tasks',
      description: 'All tasks are verified and legitimate earning opportunities'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Fast and reliable payment processing for completed tasks'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Available worldwide with multi-language support'
    }
  ];

  const milestones = [
    { year: '2024', event: 'EARNINGSLLC Founded', achievement: 'Platform launched with mission to democratize earning' },
    { year: 'Q1 2024', event: '10K Users Milestone', achievement: 'Reached first major user milestone' },
    { year: 'Q2 2024', event: '1M Tasks Completed', achievement: 'Users completed 1 million verified tasks' },
    { year: 'Q3 2024', event: 'Global Expansion', achievement: 'Expanded to 50+ countries worldwide' },
    { year: 'Q4 2024', event: 'Enterprise Launch', achievement: 'Introduced business and enterprise solutions' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            About EARNINGSLLC
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Empowering individuals worldwide with legitimate earning opportunities through verified digital tasks 
            and professional platform services since 2024.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-lg">
              <span className="text-green-300 font-semibold">✓ Legally Registered</span>
            </div>
            <div className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <span className="text-blue-300 font-semibold">✓ SSL Certified</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-lg">
              <span className="text-purple-300 font-semibold">✓ GDPR Compliant</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="text-center p-6">
                  <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80 leading-relaxed">
                At EARNINGSLLC, our mission is to create a transparent, secure, and accessible platform 
                where individuals can earn legitimate income through verified digital tasks. We believe in financial 
                empowerment through technology and opportunity.
              </p>
              <p className="text-white/80 leading-relaxed">
                We bridge the gap between businesses needing digital tasks and individuals seeking flexible 
                earning opportunities, creating value for both sides of the marketplace.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80 leading-relaxed">
                To become the world's most trusted platform for digital task-based earning, recognized for 
                our commitment to security, transparency, and user success.
              </p>
              <p className="text-white/80 leading-relaxed">
                We envision a future where anyone, anywhere can access legitimate earning opportunities 
                without barriers or compromise.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Why Choose EARNINGSLLC?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all">
                  <CardContent className="text-center p-6">
                    <Icon className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Company Timeline */}
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">Our Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-20 text-purple-300 font-bold">{milestone.year}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">{milestone.event}</h4>
                    <p className="text-white/70 text-sm">{milestone.achievement}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust & Security Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security First
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Regular Security Audits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Secure Data Centers</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Business Registered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">AML/KYC Procedures</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                24/7 Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Live Chat Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Email Response &lt;2hrs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Telegram Support</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="text-center p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust EARNINGSLLC for legitimate earning opportunities 
              and professional platform services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105">
                Get Started Now
              </button>
              <button className="px-8 py-4 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all border border-white/30">
                Learn More
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
