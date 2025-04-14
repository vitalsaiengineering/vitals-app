import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/context/UsersContext";
import { MoreVertical, Edit, Key, Ban } from "lucide-react";

interface UserActionMenuProps {
  user: User;
}

const UserActionMenu = ({ user }: UserActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Key className="mr-2 h-4 w-4" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">
          <Ban className="mr-2 h-4 w-4" />
          {user.status === "Active" ? "Deactivate User" : "Activate User"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActionMenu;