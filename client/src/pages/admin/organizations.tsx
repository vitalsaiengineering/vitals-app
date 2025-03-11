import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createOrganization } from "@/lib/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
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

// Schema for the organization form
const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

type OrganizationValues = z.infer<typeof organizationSchema>;

export default function Organizations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast({
        title: "Organization created",
        description: "New organization has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error creating organization",
        description: "There was a problem creating the organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: OrganizationValues) {
    createOrgMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
          <p>Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Organizations</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage client organizations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="material-icons mr-2">business</span>
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Enter the organization details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                    disabled={createOrgMutation.isPending}
                  >
                    {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {organizations && organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="material-icons">more_vert</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Users</DropdownMenuItem>
                          <DropdownMenuItem>Edit Organization</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete Organization</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <span className="material-icons text-4xl mb-2">business</span>
              <p>No organizations found.</p>
              <p className="text-sm">Add your first organization using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
