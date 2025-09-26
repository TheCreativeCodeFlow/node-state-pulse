import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TestPage = () => {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">NetLab Explorer</h1>
        <p className="text-muted-foreground mb-6">
          Network Simulation Platform is Loading...
        </p>
        <Button className="w-full">
          Get Started
        </Button>
      </Card>
    </div>
  );
};

export default TestPage;