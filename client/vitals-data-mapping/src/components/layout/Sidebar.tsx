
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Settings, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    name: 'Integration Settings', 
    path: '/settings', 
    icon: <Settings className="w-5 h-5" />
  },
  { 
    name: 'Vitals AI Inputs', 
    path: '/settings/vitals', 
    icon: <img src="/lovable-uploads/514cb508-9e6f-4373-9956-ea683f13517a.png" alt="Vitals AI Inputs" className="w-5 h-5" /> 
  },
  { 
    name: 'Wealthbox', 
    path: '/settings/wealthbox', 
    icon: <img src="/lovable-uploads/29d0ae34-09aa-4ff9-9a3f-d674f8d53894.png" alt="Wealthbox" className="w-5 h-5" /> 
  },
  { 
    name: 'Orion Advisor', 
    path: '/settings/orion', 
    icon: <img src="/lovable-uploads/8a1fd350-aa27-4be5-ab77-22ad84fe1936.png" alt="Orion" className="w-5 h-5" /> 
  }
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-border hidden md:block">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold">Data Mapper</h1>
        <p className="text-sm text-muted-foreground mt-1">Integration Settings</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
