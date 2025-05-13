import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart, 
  DollarSign, 
  Settings, 
  Users, 
  User,
  Calendar,
  MessageCircle,
  Bell
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href,
  active = false
}: { 
  icon: React.ElementType, 
  label: string,
  href: string,
  active?: boolean
}) => {
  return (
    <Link href={href}>
      <a className="block">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 px-3 font-normal",
            active 
              ? "bg-white/10 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Button>
      </a>
    </Link>
  );
};

export const AppSidebar = () => {
  const [location] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/me');
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="h-screen w-64 bg-vitals-blue flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-vitals-blue font-bold">V</span>
          </div>
          <span className="text-white font-semibold text-lg">Vitals AI</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 px-3 py-2 space-y-1">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          href="/"
          active={location === '/'} 
        />
        <SidebarItem 
          icon={BarChart} 
          label="Reporting" 
          href="/reporting"
          active={location === '/reporting'} 
        />
        <SidebarItem 
          icon={DollarSign} 
          label="Valuation" 
          href="/valuation"
          active={location === '/valuation'} 
        />
        <SidebarItem 
          icon={Calendar} 
          label="Calendar" 
          href="/calendar"
          active={location === '/calendar'} 
        />
        <SidebarItem 
          icon={MessageCircle} 
          label="Messages" 
          href="/messages"
          active={location === '/messages'} 
        />
        <SidebarItem 
          icon={Bell} 
          label="Notifications" 
          href="/notifications"
          active={location === '/notifications'} 
        />
        <SidebarItem 
          icon={Settings} 
          label="Settings" 
          href="/settings"
          active={location.startsWith('/settings')} 
        />
        <SidebarItem 
          icon={Users} 
          label="Clients" 
          href="/clients"
          active={location === '/clients'} 
        />
        <SidebarItem 
          icon={User} 
          label="Profile" 
          href="/profile"
          active={location === '/profile'} 
        />
      </div>

      {/* Administration section */}
      {user && (user.role === 'admin' || user.role === 'firm_admin') && (
        <div className="px-6 py-3">
          <div className="text-white/50 text-xs font-medium mb-2">ADMINISTRATION</div>
          <div className="px-3 space-y-1">
            <SidebarItem 
              icon={Settings} 
              label="User Management" 
              href="/admin/users"
              active={location === '/admin/users'}
            />
            <SidebarItem 
              icon={Settings} 
              label="Organizations" 
              href="/admin/organizations"
              active={location === '/admin/organizations'}
            />
          </div>
        </div>
      )}

      {/* User profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-vitals-lightBlue flex items-center justify-center text-white font-medium">
            {loading ? '...' : (user ? getInitials(user.name) : 'GU')}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">
              {loading ? 'Loading...' : (user ? user.name : 'Guest User')}
            </span>
            <span className="text-white/50 text-xs">
              {loading ? '...' : (user ? user.role : 'Not logged in')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};