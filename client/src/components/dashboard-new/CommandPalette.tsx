import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Briefcase } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

type CommandOption = {
  name: string;
  path: string;
  keywords: string[];
};

const navigationOptions: CommandOption[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    keywords: ['home', 'main', 'overview'],
  },
  {
    name: 'Reporting',
    path: '/reporting',
    keywords: ['reports', 'analytics', 'data', 'stats', 'metrics'],
  },
  {
    name: 'Clients',
    path: '/clients',
    keywords: ['customers', 'users', 'people'],
  },
  {
    name: 'Settings',
    path: '/settings',
    keywords: ['config', 'preferences', 'options'],
  },
  {
    name: 'Profile',
    path: '/profile',
    keywords: ['account', 'user', 'personal'],
  },
];

// Adding favorites to command palette
const favoriteOptions: CommandOption[] = [
  {
    name: 'Age Demographics',
    path: '/reporting/age-demographics',
    keywords: ['age', 'demographics', 'report', 'favorite'],
  },
  {
    name: 'Book Development',
    path: '/reporting/clients-aum-overtime',
    keywords: ['book', 'development', 'report', 'favorite'],
  },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open = false, onOpenChange }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [, navigate] = useLocation();

  // Sync internal state with props
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    // Add event listener for CTRL+K, CMD+K, or / key
    const handleKeyDown = (e: KeyboardEvent) => {
      // For CTRL+K or CMD+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const newState = !isOpen;
        setIsOpen(newState);
        onOpenChange?.(newState);
        return;
      }
      
      // For slash key (only respond to / when no input is focused)
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsOpen(true);
        onOpenChange?.(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Search application..." autoFocus />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationOptions.map((option) => (
            <CommandItem 
              key={option.path} 
              onSelect={() => handleSelect(option.path)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Search className="h-4 w-4 opacity-50" />
              <span>{option.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandGroup heading="Favorites">
          {favoriteOptions.map((option) => (
            <CommandItem 
              key={option.path} 
              onSelect={() => handleSelect(option.path)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Search className="h-4 w-4 opacity-50" />
              <span>{option.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
} 