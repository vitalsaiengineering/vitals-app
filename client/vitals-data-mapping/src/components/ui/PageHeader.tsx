
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backLink) {
      navigate(backLink);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="py-6 border-b border-border mb-8 animate-fade-in">
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
