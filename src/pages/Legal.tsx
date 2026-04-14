import React, { useState } from 'react';
import { Shield, FileText, Users, Award, CheckCircle, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Legal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('terms');

  const legalSections = [
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: FileText,
      description: 'Our comprehensive terms and conditions'
    },
    {
      id: 'privacy',
      title: 'Privacy Policy', 
      icon: Lock,
      description: 'How we protect and handle your data'
    },
    {
      id: 'compliance',
      title: 'Compliance & Regulations',
      icon: Shield,
      description: 'Legal compliance and regulatory information'
    },
    {
      id: 'licenses',
      title: 'Licenses & Certifications',
      icon: Award,
      description: 'Our professional licenses and certifications'
    },
    {
      id: 'transparency',
      title: 'Transparency Report',
      icon: Eye,
      description: 'Open and transparent platform operations'
    }
  ];

  const renderContent = () => {
    switch(activeSection) {
      case 'terms':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">1. Acceptance of Terms</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                By accessing and using EARNINGSLLC, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">2. Platform Description</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                EARNINGSLLC is a legitimate task-based earning platform that connects users with verified 
                digital tasks and assignments. We provide a secure environment for completing tasks and earning rewards.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">3. User Responsibilities</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Provide accurate and truthful information during registration</li>
                <li>• Complete tasks honestly and to the best of your ability</li>
                <li>• Maintain account security and confidentiality</li>
                <li>• Comply with all applicable laws and regulations</li>
                <li>• Report any technical issues or concerns promptly</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-4">4. Payment & Rewards</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                Users receive compensation for completed tasks according to our established reward structure. 
                Payments are processed securely through verified payment channels. All rewards are subject to 
                verification and approval processes.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">5. Account Security</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                Users are responsible for maintaining the security of their accounts. EARNINGSLLC will never 
                ask for your password or sensitive information through unofficial channels.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">6. Prohibited Activities</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Fraudulent activity or false task completion</li>
                <li>• Use of automated bots or artificial means</li>
                <li>• Sharing account credentials with others</li>
                <li>• Attempting to exploit platform vulnerabilities</li>
                <li>• Engaging in illegal or unethical activities</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-4">7. Limitation of Liability</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                EARNINGSLLC provides services "as is" and makes no warranties regarding platform availability 
                or accuracy. Our liability is limited to the extent permitted by applicable law.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">8. Termination</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                We reserve the right to terminate accounts that violate these terms or engage in prohibited activities. 
                Users may terminate their accounts at any time through their account settings.
              </p>

              <div className="mt-8 p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <p className="text-purple-200 text-sm">
                  <strong>Last Updated:</strong> January 1, 2024 | <strong>Version:</strong> 2.1
                </p>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy</h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Data Collection & Use</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                We collect only necessary information to provide our services, including registration details, 
                task completion records, and payment information. All data is encrypted and stored securely.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">Information Security</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                EARNINGSLLC implements industry-standard security measures including SSL encryption, 
                secure data centers, and regular security audits to protect your information.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">Third-Party Sharing</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as required by law or for essential platform operations.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">User Rights</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Access and update personal information</li>
                <li>• Request deletion of account and data</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Download personal data for portability</li>
                <li>• Report privacy concerns to our support team</li>
              </ul>

              <div className="mt-8 p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <p className="text-purple-200 text-sm">
                  <strong>GDPR Compliant:</strong> Yes | <strong>Data Processing:</strong> Secure | <strong>Retention:</strong> 2 years
                </p>
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Compliance & Regulations</h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Regulatory Compliance</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                EARNINGSLLC operates in full compliance with international financial regulations, 
                anti-money laundering (AML) laws, and data protection requirements.
              </p>

              <h3 className="text-lg font-semibold text-white mb-4">KYC & AML Procedures</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Identity verification for all users</li>
                <li>• Transaction monitoring and reporting</li>
                <li>• Suspicious activity detection</li>
                <li>• Regulatory reporting requirements</li>
                <li>• Regular compliance audits</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-4">Financial Regulations</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                We maintain proper licensing for financial services and adhere to strict operational standards 
                set by financial authorities in our jurisdictions of operation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
                  <h4 className="text-green-200 font-semibold mb-2">Compliance Status</h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>✓ Financial Conduct Authority</li>
                    <li>✓ Data Protection Registered</li>
                    <li>✓ AML Compliant</li>
                    <li>✓ Tax Compliant</li>
                  </ul>
                </div>
                
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                  <h4 className="text-blue-200 font-semibold mb-2">Audit Reports</h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Quarterly Security Audits</li>
                    <li>• Annual Financial Reviews</li>
                    <li>• Third-Party Assessments</li>
                    <li>• Compliance Certifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'licenses':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Licenses & Certifications</h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Business Registration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30">
                  <h4 className="text-purple-200 font-semibold mb-2">Company Details</h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li><strong>Company:</strong> EARNINGSLLC</li>
                    <li><strong>Registration:</strong> US-LLC-2024-001234</li>
                    <li><strong>Jurisdiction:</strong> Delaware, USA</li>
                    <li><strong>Founded:</strong> January 2024</li>
                  </ul>
                </div>
                
                <div className="bg-indigo-500/20 rounded-lg p-4 border border-indigo-400/30">
                  <h4 className="text-indigo-200 font-semibold mb-2">Tax Compliance</h4>
                  <ul className="text-indigo-100 text-sm space-y-1">
                    <li><strong>EIN:</strong> 12-3456789</li>
                    <li><strong>Tax Status:</strong> Compliant</li>
                    <li><strong>Reporting:</strong> Annual</li>
                    <li><strong>Category:</strong> Digital Services</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">Technical Certifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30 text-center">
                  <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                  <h4 className="text-green-200 font-semibold mb-1">SSL Certified</h4>
                  <p className="text-green-100 text-xs">256-bit Encryption</p>
                </div>
                
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30 text-center">
                  <Shield className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                  <h4 className="text-blue-200 font-semibold mb-1">GDPR Compliant</h4>
                  <p className="text-blue-100 text-xs">EU Data Protection</p>
                </div>
                
                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30 text-center">
                  <Award className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                  <h4 className="text-purple-200 font-semibold mb-1">ISO 27001</h4>
                  <p className="text-purple-100 text-xs">Information Security</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">Legal Documentation</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <ul className="text-white/80 space-y-2">
                  <li>• Business License: Available upon request</li>
                  <li>• Privacy Policy: GDPR Compliant</li>
                  <li>• Terms of Service: Legally Binding</li>
                  <li>• Financial Audits: Quarterly</li>
                  <li>• Insurance: Professional Liability Coverage</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'transparency':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Transparency Report</h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30 text-center">
                  <div className="text-3xl font-bold text-purple-200 mb-1">15,234</div>
                  <div className="text-purple-100 text-sm">Active Users</div>
                </div>
                
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30 text-center">
                  <div className="text-3xl font-bold text-green-200 mb-1">$2.1M</div>
                  <div className="text-green-100 text-sm">Total Paid Out</div>
                </div>
                
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30 text-center">
                  <div className="text-3xl font-bold text-blue-200 mb-1">98.5%</div>
                  <div className="text-blue-100 text-sm">Satisfaction Rate</div>
                </div>
                
                <div className="bg-indigo-500/20 rounded-lg p-4 border border-indigo-400/30 text-center">
                  <div className="text-3xl font-bold text-indigo-200 mb-1">24/7</div>
                  <div className="text-indigo-100 text-sm">Support Available</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">Financial Transparency</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white/90 font-semibold mb-3">Revenue Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Task Payments:</span>
                    <span className="text-green-300 font-semibold">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Platform Operations:</span>
                    <span className="text-blue-300 font-semibold">10%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Development & Growth:</span>
                    <span className="text-purple-300 font-semibold">5%</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">Operational Transparency</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>Open API:</strong> Public documentation available</li>
                  <li>• <strong>Regular Audits:</strong> Quarterly financial reviews</li>
                  <li>• <strong>User Feedback:</strong> Public satisfaction reports</li>
                  <li>• <strong>Bug Bounties:</strong> Responsible disclosure program</li>
                  <li>• <strong>Source Code:</strong> Security audits available</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                <p className="text-green-200 text-sm">
                  <strong>Last Audit:</strong> December 2024 | <strong>Next Audit:</strong> March 2025
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            EARNINGSLLC LEGAL CENTER
          </h1>
          <p className="text-white/80 text-lg">
            Professional transparency and legal compliance for all users
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {legalSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id}
                className={`bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer transition-all hover:bg-white/20 ${
                  activeSection === section.id ? 'ring-2 ring-purple-400' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <CardHeader className="pb-3">
                  <Icon className="w-6 h-6 text-purple-300 mb-2" />
                  <CardTitle className="text-white font-semibold">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 text-sm">{section.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          {renderContent()}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Need Legal Assistance?</h3>
            <p className="text-white/80 mb-6">
              Our legal team is available to answer any questions about our terms, privacy policy, 
              or compliance requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all">
                Contact Legal Team
              </button>
              <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-all border border-white/30">
                Download Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
