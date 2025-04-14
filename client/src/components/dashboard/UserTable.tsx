import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface UserTableProps {
  users: any[];
  organizations?: any[];
}

// Format role for display (moved from users.tsx)
const formatRole = (role: string) => {
  console.log("formatRole", role);
  switch (role.name) {
    case "global_admin":
      return "Global Admin";
    case "firm_admin":
      return "Client Admin";
    case "advisor":
      return "Financial Advisor";
    default:
      return role;
  }
};

// Role badge variant (moved from users.tsx)
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "global_admin":
      return "destructive";
    case "firm_admin":
      return "default";
    case "advisor":
      return "secondary";
    default:
      return "outline";
  }
};

const UserTable = ({ users, organizations }: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-blue-50">
          <TableHead>User</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>WealthBox</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {formatRole(user.role)}
              </Badge>
            </TableCell>
            <TableCell>
              {organizations?.find(org => org.id === user.organizationId)?.name || 'N/A'}
            </TableCell>
            <TableCell>
              {user.wealthboxConnected ? (
                <Badge variant="success" className="bg-green-100 text-green-800">Connected</Badge>
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
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;