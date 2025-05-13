
import React from 'react';
import { Search, Bot, Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const Header = () => {
  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="relative w-[450px]">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Ask Vitals Anything..." 
          className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-vitals-blue focus:border-vitals-blue"
        />
        <Bot className="absolute right-4 top-1/2 transform -translate-y-1/2 text-vitals-blue" size={20} />
      </div>
      
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Bell size={20} className="text-gray-600 cursor-pointer" />
                <span className="absolute -top-1 -right-1 bg-vitals-red text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                  3
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>3 new notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-vitals-blue flex items-center justify-center text-white font-medium">
            JS
          </div>
          <div>
            <div className="text-sm font-medium">Jack Sample</div>
            <div className="text-xs text-gray-500">Advisor</div>
          </div>
        </div>
      </div>
    </header>
  );
};
