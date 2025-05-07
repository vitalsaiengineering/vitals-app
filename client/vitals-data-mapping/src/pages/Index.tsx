
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center max-w-3xl px-6 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Data Mapping Interface
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          A modern, minimalist interface for mapping data between your firm and integration partners.
        </p>
        <Link 
          to="/settings"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-apple-blue text-white font-medium transition-all duration-300 hover:bg-apple-darkBlue"
        >
          Go to Settings
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default Index;
