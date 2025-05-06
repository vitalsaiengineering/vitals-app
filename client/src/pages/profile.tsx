import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Save, User, Building2, Mail, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileField {
  id: string;
  label: string;
  value: string;
  icon: React.ElementType;
}

export default function Profile() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch current user data
  const { data: user, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/me"],
    retry: false,
  });
  
  // Define all profile fields with values from user data
  const [profileFields, setProfileFields] = useState<ProfileField[]>([
    { id: 'fullName', label: 'Full Name', value: 'Loading...', icon: User },
    { id: 'companyName', label: 'Company Name', value: 'Loading...', icon: Building2 },
    { id: 'jobTitle', label: 'Job Title', value: 'Loading...', icon: User },
    { id: 'email', label: 'Email Address', value: 'Loading...', icon: Mail },
    { id: 'officeAddress', label: 'Office Address', value: 'Loading...', icon: MapPin },
    { id: 'phone', label: 'Phone Number', value: 'Loading...', icon: Phone },
  ]);
  
  // Update profile fields when user data is loaded
  React.useEffect(() => {
    if (user) {
      // Get role name based on roleId (if available)
      const roleId = user.roleId || 0;
      const roleName = roleId === 1 ? "Global Admin" : 
                      roleId === 2 ? "Multi-Network Admin" :
                      roleId === 3 ? "Network Admin" :
                      roleId === 4 ? "Firm Admin" :
                      roleId === 5 ? "Advisor" : "User";
                      
      setProfileFields([
        { id: 'fullName', label: 'Full Name', value: `${user.firstName || ''} ${user.lastName || ''}`, icon: User },
        { id: 'companyName', label: 'Company Name', value: user.organization?.name || 'Not specified', icon: Building2 },
        { id: 'jobTitle', label: 'Job Title', value: roleName, icon: User },
        { id: 'email', label: 'Email Address', value: user.email || 'Not specified', icon: Mail },
        { id: 'officeAddress', label: 'Office Address', value: 'Not specified', icon: MapPin },
        { id: 'phone', label: 'Phone Number', value: 'Not specified', icon: Phone },
      ]);
    }
  }, [user]);

  // Temp state for editing fields
  const [tempFieldValue, setTempFieldValue] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image file size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
        setDialogOpen(false);
        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditField = (fieldId: string) => {
    const field = profileFields.find(f => f.id === fieldId);
    if (field) {
      setTempFieldValue(field.value);
      setEditingField(fieldId);
    }
  };

  const handleSaveField = () => {
    if (editingField) {
      setProfileFields(fields => 
        fields.map(field => 
          field.id === editingField ? { ...field, value: tempFieldValue } : field
        )
      );
      setEditingField(null);
      
      toast({
        title: "Success",
        description: "Profile information updated successfully",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };
  
  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-md text-gray-500">
          Manage your personal information and preferences
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column - Profile Image */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Your profile image</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-40 w-40 border-4 border-background shadow-md">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={profileFields.find(f => f.id === 'fullName')?.value || ''} />
                ) : (
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Upload Headshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Profile Picture</DialogTitle>
                  <DialogDescription>
                    Upload a new profile picture. Recommended size is 400x400 pixels.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                    <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Label 
                      htmlFor="picture" 
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Choose File
                    </Label>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Maximum file size: 5MB. Supported formats: JPG, PNG, GIF.
                    </AlertDescription>
                  </Alert>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Right Column - Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>View and update your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={field.id} className="flex items-center gap-2">
                    <field.icon className="h-4 w-4" />
                    {field.label}
                  </Label>
                  {editingField !== field.id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditField(field.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                
                {editingField === field.id ? (
                  <div className="space-y-2">
                    {field.id === 'officeAddress' ? (
                      <Textarea
                        id={field.id}
                        value={tempFieldValue}
                        onChange={(e) => setTempFieldValue(e.target.value)}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        className="text-lg"
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={tempFieldValue}
                        onChange={(e) => setTempFieldValue(e.target.value)}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        className="text-lg"
                        type={field.id === 'email' ? 'email' : field.id === 'phone' ? 'tel' : 'text'}
                      />
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveField}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-medium">{field.value}</div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline">Reset All Fields</Button>
            <Button>Save All Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}