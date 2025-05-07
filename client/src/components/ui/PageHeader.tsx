import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backLink
}) => {
  const [_, navigate] = useLocation();
  
  const handleBack = () => {
    if (backLink) {
      // Handle URL to go back to data-mapping tab
      if (backLink === '/settings') {
        // Always navigate back to data-mapping tab
        navigate('/settings?tab=data-mapping', { replace: true });
      } else {
        navigate(backLink);
      }
    } else {
      // In wouter, we can't navigate(-1) like react-router, 
      // so we'll just navigate to the data-mapping tab
      navigate('/settings?tab=data-mapping', { replace: true });
    }
  };

  return (
    <div className="py-6 border-b border-border mb-8">
      <div className="max-w-5xl mx-auto">
        {backLink !== undefined && (
          <button 
            onClick={handleBack}
            className="flex items-center text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;