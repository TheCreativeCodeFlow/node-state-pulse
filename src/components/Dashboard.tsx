import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Play, 
  Network, 
  Zap, 
  BarChart3, 
  Users, 
  Shield,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  onStartSimulation: () => void;
  onBackToSessions?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartSimulation, onBackToSessions }) => {
  const features = [
    {
      icon: Network,
      title: 'Network Topology',
      description: 'Create and visualize complex network architectures',
      color: 'neon-blue',
      delay: 0
    },
    {
      icon: Zap,
      title: 'Real-time Simulation',
      description: 'Watch packets flow with advanced physics',
      color: 'neon-green',
      delay: 100
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Deep insights into network performance',
      color: 'neon-purple',
      delay: 200
    },
    {
      icon: Shield,
      title: 'AI-Powered Assistance',
      description: 'Get intelligent recommendations and help',
      color: 'neon-blue',
      delay: 300
    }
  ];

  const stats = [
    { label: 'Active Simulations', value: '2.4k+', trend: '+12%' },
    { label: 'Networks Created', value: '15.7k', trend: '+8%' },
    { label: 'Users Learning', value: '890', trend: '+24%' }
  ];

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden">
      {/* Scrollable Container */}
      <div className="h-full overflow-y-auto">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full animate-pulse"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, hsl(var(--neon-blue)) 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, hsl(var(--neon-green)) 1px, transparent 1px),
              linear-gradient(hsl(var(--neon-purple)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--neon-blue)) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 150px 150px, 50px 50px, 50px 50px',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-neon-blue/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-neon-green/10 rounded-full blur-xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl animate-bounce-slow" />

      <div className="relative z-10 container mx-auto px-6 py-8 md:py-12 pb-20 md:pb-24">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16 animate-fade-in">
          <Badge className="mb-4 px-4 py-2 glass-card border-neon-blue/30 text-neon-blue">
            <Sparkles className="w-4 h-4 mr-2" />
            NetLab Explorer v2.0
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-neon-blue via-neon-green to-neon-purple bg-clip-text text-transparent">
            Interactive Network
            <br />
            Simulation Platform
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Master network concepts with our AI-powered simulator. Build, test, and visualize 
            complex network topologies with real-time packet analysis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onStartSimulation}
              className="group h-14 px-8 glass-card neon-glow-green hover:scale-105 transition-all duration-300 w-full sm:w-auto bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Simulation
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {onBackToSessions ? (
              <Button 
                variant="outline" 
                size="lg"
                onClick={onBackToSessions}
                className="h-14 px-8 glass-card border-border/50 hover:border-neon-blue/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                <Users className="w-5 h-5 mr-2" />
                Change Session
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 glass-card border-border/50 hover:border-neon-blue/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-16">
          {stats.map((stat, index) => (
            <Card 
              key={stat.label}
              className="glass-card p-6 text-center hover:neon-glow transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl font-bold text-neon-blue mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-status-success">{stat.trend}</div>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.title}
                className="group glass-card p-6 hover:scale-105 hover:neon-glow cursor-pointer transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div 
                  className="w-12 h-12 rounded-xl glass mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ 
                    backgroundColor: `hsl(var(--${feature.color}) / 0.1)`,
                    borderColor: `hsl(var(--${feature.color}) / 0.3)`
                  }}
                >
                  <IconComponent 
                    className="w-6 h-6"
                    style={{ color: `hsl(var(--${feature.color}))` }}
                  />
                </div>
                
                <h3 className="font-semibold mb-2 text-foreground group-hover:text-neon-blue transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-xs text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in">
          <div className="glass-card p-6 md:p-8 rounded-3xl max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Ready to explore the future of network learning?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of students, engineers, and researchers using NetLab Explorer 
              to master network concepts through interactive simulation.
            </p>
            <Button 
              size="lg"
              onClick={onStartSimulation}
              className="group h-12 px-6 neon-glow-green hover:scale-105 transition-all duration-300 bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30"
            >
              <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Launch NetLab Explorer
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};