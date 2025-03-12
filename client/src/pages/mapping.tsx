import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createMapping, deleteMapping } from "@/lib/api";
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
import { getWealthboxStatus } from "@/lib/api";

// Schema for the mapping form
const mappingSchema = z.object({
  sourceField: z.string().min(1, "Source field is required"),
  targetField: z.string().min(1, "Target field is required"),
});

type MappingValues = z.infer<typeof mappingSchema>;

// Source field options from WealthBox
const sourceFields = [
  { value: "contact.name", label: "Contact Name" },
  { value: "contact.email", label: "Contact Email" },
  { value: "contact.phone", label: "Contact Phone" },
  { value: "contact.address", label: "Contact Address" },
  { value: "account.type", label: "Account Type" },
  { value: "account.number", label: "Account Number" },
  { value: "account.balance", label: "Account Balance" },
  { value: "portfolio.allocation", label: "Portfolio Allocation" },
  { value: "portfolio.performance", label: "Portfolio Performance" },
  { value: "activity.type", label: "Activity Type" },
  { value: "activity.date", label: "Activity Date" },
  { value: "activity.notes", label: "Activity Notes" },
];

// Target field options for our system
const targetFields = [
  { value: "client.name", label: "Client Name" },
  { value: "client.email", label: "Client Email" },
  { value: "client.phone", label: "Client Phone" },
  { value: "client.address", label: "Client Address" },
  { value: "client.city", label: "Client City" },
  { value: "client.state", label: "Client State" },
  { value: "client.zip", label: "Client ZIP" },
  { value: "client.age", label: "Client Age" },
  { value: "client.aum", label: "Client AUM" },
  { value: "client.revenue", label: "Client Revenue" },
  { value: "portfolio.name", label: "Portfolio Name" },
  { value: "portfolio.totalValue", label: "Portfolio Total Value" },
  { value: "activity.type", label: "Activity Type" },
  { value: "activity.title", label: "Activity Title" },
  { value: "activity.description", label: "Activity Description" },
  { value: "activity.date", label: "Activity Date" },
  { value: "holding.assetClass", label: "Holding Asset Class" },
  { value: "holding.name", label: "Holding Name" },
  { value: "holding.value", label: "Holding Value" },
  { value: "holding.allocation", label: "Holding Allocation" },
  { value: "holding.performance", label: "Holding Performance" },
];

export default function Mapping() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
  });
  
  // Fetch WealthBox connection status
  const { data: wealthboxStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['/api/wealthbox/status'],
  });

  // Fetch existing mappings
  const { data: mappings, isLoading: isLoadingMappings, isError: isMappingsError } = useQuery({
    queryKey: ['/api/mappings'],
    enabled: !!wealthboxStatus?.connected && wealthboxStatus?.authorized,
  });

  // Add new mapping
  const addMappingMutation = useMutation({
    mutationFn: createMapping,
    onSuccess: () => {
      toast({
        title: "Mapping created",
        description: "Your data mapping has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mappings'] });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Mapping failed",
        description: "There was a problem creating your data mapping.",
        variant: "destructive",
      });
    },
  });

  // Delete mapping
  const deleteMappingMutation = useMutation({
    mutationFn: deleteMapping,
    onSuccess: () => {
      toast({
        title: "Mapping deleted",
        description: "Your data mapping has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mappings'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was a problem deleting your data mapping.",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<MappingValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      sourceField: "",
      targetField: "",
    },
  });

  function onSubmit(data: MappingValues) {
    addMappingMutation.mutate(data);
  }

  function handleDeleteMapping(id: number) {
    deleteMappingMutation.mutate(id);
  }

  const isLoading = isLoadingStatus || isLoadingMappings || isLoadingUser;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
          <p>Loading data mapping...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is authorized
  const isAuthorized = wealthboxStatus?.authorized || false;
  
  // If user is not authorized, show access restricted message
  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Data Mapping</h1>
          <p className="mt-1 text-sm text-neutral-500">Map WealthBox data fields to your system</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m0 0H9m3 0h3m-3 8h.01M12 3a9 9 0 110 18 9 9 0 010-18z"></path>
              </svg>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">Access Restricted</h3>
              <p className="text-neutral-500 mb-6">Data mapping is only available to firm administrators. Please contact your firm administrator for assistance.</p>
              <Button asChild variant="outline">
                <a href="/dashboard">Return to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!wealthboxStatus?.connected) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Data Mapping</h1>
          <p className="mt-1 text-sm text-neutral-500">Map WealthBox data fields to your system</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">WealthBox Not Connected</h3>
              <p className="text-neutral-500 mb-6">You need to connect your WealthBox account before setting up data mappings.</p>
              <Button asChild>
                <a href="/integrations">Connect WealthBox</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Data Mapping</h1>
        <p className="mt-1 text-sm text-neutral-500">Map WealthBox data fields to your system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Mapping Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Mapping</CardTitle>
            <CardDescription>Map fields from WealthBox to your system</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="sourceField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WealthBox Source Field</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a source field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceFields.map((sourceField) => (
                            <SelectItem key={sourceField.value} value={sourceField.value}>
                              {sourceField.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Target Field</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a target field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {targetFields.map((targetField) => (
                            <SelectItem key={targetField.value} value={targetField.value}>
                              {targetField.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={addMappingMutation.isPending}
                >
                  {addMappingMutation.isPending ? "Creating..." : "Create Mapping"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Mapping Guide Card */}
        <Card>
          <CardHeader>
            <CardTitle>Mapping Guide</CardTitle>
            <CardDescription>How data mapping works</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Data mapping allows you to control how information from WealthBox is imported into your system.
              By creating mappings, you define which WealthBox fields correspond to which fields in your system.
            </p>
            
            <h4 className="text-base font-medium mt-4">Best Practices</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Map essential client information first (name, email, phone)</li>
              <li>Ensure portfolio and financial data is properly mapped for accurate reporting</li>
              <li>Map activity data to track client interactions</li>
              <li>Check your mappings after import to verify data accuracy</li>
            </ul>
            
            <h4 className="text-base font-medium mt-4">Automatic Mappings</h4>
            <p>
              Some fields are automatically mapped based on common standards. You only need to create
              custom mappings for fields that require special handling or aren't mapped by default.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Mappings Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
          <CardDescription>Your configured data field mappings</CardDescription>
        </CardHeader>
        <CardContent>
          {mappings && mappings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WealthBox Source Field</TableHead>
                  <TableHead>System Target Field</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      {sourceFields.find(f => f.value === mapping.sourceField)?.label || mapping.sourceField}
                    </TableCell>
                    <TableCell>
                      {targetFields.find(f => f.value === mapping.targetField)?.label || mapping.targetField}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        disabled={deleteMappingMutation.isPending}
                      >
                        <span className="material-icons text-sm text-red-500">delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <span className="material-icons text-4xl mb-2">tune</span>
              <p>You haven't created any data mappings yet.</p>
              <p className="text-sm">Create your first mapping using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
