import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchRoles, fetchStatuses } from "@/lib/api";
import { formatRolesForSelect, formatStatusesForSelect } from "@/utils/user";

const EditUserDialog = ({ selectedUser, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    email: "",
    role: "",
    roleId: "",
    status: "",
  });

  
  // Fetch roles from backend
  const { 
    data: roles, 
    isLoading: isRolesLoading 
  } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 60, // Cache for an hour
  });

  // Fetch statuses from backend
  const { 
    data: statuses, 
    isLoading: isStatusesLoading 
  } = useQuery({
    queryKey: ['/api/status'],
    queryFn: fetchStatuses,
    staleTime: 1000 * 60 * 60, // Cache for an hour
  });

  const isLoading = isRolesLoading || isStatusesLoading;

  const formattedRoles = formatRolesForSelect(roles);
  const formattedStatuses = formatStatusesForSelect(statuses);


  useEffect(() => {
    if (selectedUser) {
      setFormData({
        fullName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        displayName: selectedUser.firstName || "",
        email: selectedUser.email || "",
        role: selectedUser.role.name || "",
        roleId: selectedUser.role.id || null,
        status: selectedUser.status || "",
      });
    }
  }, [selectedUser]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const { role, ...dataToSubmit } = formData;
    console.log("Submitting form data:", dataToSubmit);
    onUpdate(
      selectedUser.id,
      dataToSubmit,
    );
  };

  return (
    <Dialog open={!!selectedUser} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.roleId?.toString() || ''}
                onValueChange={(selectedId) => {
                  // Find the corresponding role using the ID
                  const selectedRole = formattedRoles.find(r => r.id.toString() === selectedId);

                  // Update both roleId and role name in the form data
                  handleChange("roleId", parseInt(selectedId, 10));
                  handleChange("role", selectedRole?.value || '');
                }}
                disabled={isRolesLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-white">
                  {formattedRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.label} <span className="text-xs text-gray-500 ml-1">(#{role.id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={isStatusesLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-white">
                  {formattedStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;