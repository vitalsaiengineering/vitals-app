
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  wealthboxConnected: boolean;
}

export function AdvisorsList() {
  const { user } = useAuth();
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdvisors() {
      try {
        setLoading(true);
        const response = await fetch('/api/users/advisors');
        
        if (!response.ok) {
          throw new Error('Failed to fetch advisors');
        }
        
        const data = await response.json();
        setAdvisors(data);
      } catch (err) {
        console.error('Error fetching advisors:', err);
        setError('Failed to load advisors. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchAdvisors();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center py-8">Loading advisors...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Wealthbox</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advisors.length > 0 ? (
            advisors.map((advisor) => (
              <TableRow key={advisor.id}>
                <TableCell className="font-medium">{advisor.fullName}</TableCell>
                <TableCell>{advisor.username}</TableCell>
                <TableCell>{advisor.email}</TableCell>
                <TableCell>
                  {advisor.wealthboxConnected ? (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-neutral-100 text-neutral-800">Not Connected</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <span className="material-icons">more_vert</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit User</DropdownMenuItem>
                      <DropdownMenuItem>Reset Password</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Deactivate User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                No advisors found. Add advisors to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
