import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createUser, updateUser } from "@/lib/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { User } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Edit, Key, Ban, ChevronUp, ChevronDown } from "lucide-react";
import EditUserDialog from "@/components/ui/edit-user-dialog";

// Define type for user data
type UserData = User & { 
  role?: { name: string };
  avatarUrl?: string;
  lastLogin?: string;
};

// Define type for sort configuration
type SortConfig = {
  key: keyof UserData | 'fullName' | 'roleName';
  direction: 'asc' | 'desc';
};

// Schema for the user form
const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["global_admin", "multi_network_admin", "network_admin", "firm_admin", "advisor"], {
    required_error: "Role is required",
  }),
  organizationId: z.coerce.number().optional(),
});

type UserValues = z.infer<typeof userSchema>;

export default function Users() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Add this to your Users() functional component
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'lastName',
    direction: 'asc'
  });

  
  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserData[]>({
    queryKey: ['/api/users'],
  });

  // Fetch organizations
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['/api/organizations'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast({
        title: "User created",
        description: "New user has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error creating user",
        description: "There was a problem creating the user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (params: [number, any]) => {
      const [id, userData] = params;
      return updateUser(id, userData);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null); // Close the dialog
    },
    onError: () => {
      toast({
        title: "Error updating user",
        description: "There was a problem updating the user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to handle column sorting
  const requestSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: SortConfig['key']) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" /> 
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Sort users based on current sort configuration
  const sortedUsers = [...users].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    // Special case for fullName (combined firstName and lastName)
    if (sortConfig.key === 'fullName') {
      const fullNameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      const fullNameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB) * direction;
    }
    
    // Special case for role name
    if (sortConfig.key === 'roleName') {
      const roleA = a.role?.name || '';
      const roleB = b.role?.name || '';
      return roleA.localeCompare(roleB) * direction;
    }
    
    // Handle date fields - null values should always be at the end
    if (sortConfig.key === 'lastLogin' || sortConfig.key === 'createdAt') {
      // If a is null/undefined and b is not, a should come after b
      if (!a[sortConfig.key] && b[sortConfig.key]) return 1;
      // If b is null/undefined and a is not, b should come after a
      if (a[sortConfig.key] && !b[sortConfig.key]) return -1;
      // If both are null/undefined, maintain original order
      if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
      
      // Otherwise compare the dates
      const dateA = new Date(a[sortConfig.key] as string).getTime();
      const dateB = new Date(b[sortConfig.key] as string).getTime();
      return (dateA - dateB) * direction;
    }
    
    // Handle string fields
    const valueA = String(a[sortConfig.key as keyof UserData] || '').toLowerCase();
    const valueB = String(b[sortConfig.key as keyof UserData] || '').toLowerCase();
    
    // If one value is empty and the other isn't, empty values should be at the end
    if (!valueA && valueB) return 1;
    if (valueA && !valueB) return -1;
    
    return valueA.localeCompare(valueB) * direction;
  });

  // Form setup
  const form = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "advisor",
    },
  });

  function onSubmit(data: UserValues) {
    // Map role names to role IDs
    const roleMapping = {
      global_admin: 1,
      multi_network_admin: 2,
      network_admin: 3,
      firm_admin: 4,
      advisor: 5,
    };

    const userData = {
      ...data,
      roleId: roleMapping[data.role],
      // Use current user's organization ID
      organizationId: currentUser?.organizationId || 1,
    };

    createUserMutation.mutate(userData);
  }

  // Function to handle user update
  const handleUpdateUser = (id: number, userData: any) => {
    console.log("Updating user:", id, userData);
    updateUserMutation.mutate([id, userData]);
  };

  // Helper functions for the new UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Inactive":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Pending":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Suspended":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "global_admin":
        return "bg-purple-700 text-white border-purple-800";
      case "multi_network_admin":
        return "bg-indigo-600 text-white border-indigo-700";
      case "network_admin":
        return "bg-blue-600 text-white border-blue-700";
      case "firm_admin":
        return "bg-blue-500 text-white border-blue-600";
      case "advisor":
        return "bg-blue-300 text-blue-900 border-blue-400";
      default:
        return "bg-gray-300 text-gray-900 border-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (e) {
      return "—";
    }
  };

  const formatLastLogin = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "—";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Map role to display format
  const formatRole = (role: any) => {
    if (!role) return "Unknown";
    
    switch (role) {
      case "global_admin":
        return "Global Admin";
      case "multi_network_admin":
        return "Multi Network Admin";
      case "network_admin":
        return "Network Admin";
      case "firm_admin":
        return "Firm Admin";
      case "advisor":
        return "Advisor";
      default:
        return role;
    }
  };

  const isLoading = isLoadingUsers || isLoadingOrgs;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EditUserDialog 
        selectedUser={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onUpdate={handleUpdateUser} 
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage users and their permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="material-icons mr-2">person_add</span>
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Enter the user details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Form content remains the same */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                                                      <SelectContent>
                              <SelectItem value="global_admin">Global Admin</SelectItem>
                              <SelectItem value="multi_network_admin">Multi Network Admin</SelectItem>
                              <SelectItem value="network_admin">Network Admin</SelectItem>
                              <SelectItem value="firm_admin">Firm Admin</SelectItem>
                              <SelectItem value="advisor">Advisor</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead 
                      className="w-[250px] cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('fullName')}
                    >
                      Full name {getSortDirectionIcon('fullName')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('firstName')}
                    >
                      Display name {getSortDirectionIcon('firstName')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('email')}
                    >
                      Email address {getSortDirectionIcon('email')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('roleName')}
                    >
                      Role {getSortDirectionIcon('roleName')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('status')}
                    >
                      Status {getSortDirectionIcon('status')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('lastLogin')}
                    >
                      Last login {getSortDirectionIcon('lastLogin')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => requestSort('createdAt')}
                    >
                      Date joined {getSortDirectionIcon('createdAt')}
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={`${user.firstName || ''} ${user.lastName || ''}`} />
                            <AvatarFallback>{user.firstName && user.lastName ? getInitials(`${user.firstName} ${user.lastName}`) : ""}</AvatarFallback>
                          </Avatar>
                          <span>{user.firstName || ''} {user.lastName || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.firstName || '—'}</TableCell>
                      <TableCell>{user.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getRoleColor(user.role?.name || '')} px-2 py-1 text-xs font-medium`}>
                          {formatRole(user.role?.name || '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(user.status || '')} px-2 py-1 text-xs font-medium`}>
                          {user.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatLastLogin(user.lastLogin || '')}</TableCell>
                      <TableCell>{formatDate(user.createdAt?.toString() || '')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user); 
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              {user.status === 'active' ? "Deactivate User" : "Activate User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <span className="material-icons text-4xl mb-2">people</span>
              <p>No users found.</p>
              <p className="text-sm">Add users to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}