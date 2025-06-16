import { useState } from 'react';
import { Building, Mail, Upload, User, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FirmRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

export function FirmRegistrationModal({ 
  open, 
  onOpenChange, 
  onSubmit 
}: FirmRegistrationModalProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [firmName, setFirmName] = useState('');
  const [firmAddress, setFirmAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Logo image must be less than 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    setLogoPreview(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!firmName) {
      alert("Firm name is required");
      return;
    }
    
    if (!adminName) {
      alert("Admin name is required");
      return;
    }
    
    if (!adminEmail || !adminEmail.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }
    
    // Combine form values with logo if available
    const submissionData = {
      firmName,
      firmAddress,
      adminName,
      adminEmail,
      logoUrl: logoPreview,
    };
    
    // Call the provided onSubmit handler
    onSubmit?.(submissionData);
    
    // Reset form and close modal
    setFirmName('');
    setFirmAddress('');
    setAdminName('');
    setAdminEmail('');
    setLogoPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create your workspace</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label>Company logo</Label>
            <div className="flex items-end gap-4">
              <div className="relative">
                {logoPreview ? (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-blue-100">
                    <img 
                      src={logoPreview} 
                      alt="Company logo preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-100 text-blue-500 text-3xl font-semibold">
                    {firmName?.[0]?.toUpperCase() || 'W'}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex items-center gap-2"
                  asChild
                >
                  <label>
                    <Upload className="h-4 w-4" />
                    <span>Upload image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg"
                      onChange={handleLogoChange}
                    />
                  </label>
                </Button>
                
                {logoPreview && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={removeLogo}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">*.png, *.jpeg files up to 10MB at least 400px by 400px</p>
          </div>
          
          {/* Firm Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="firmName">Company name</Label>
            <Input 
              id="firmName"
              placeholder="Enter firm name" 
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              className="flex h-10 w-full"
              required
            />
          </div>
          
          {/* Firm Address - Optional */}
          <div className="space-y-2">
            <Label htmlFor="firmAddress">Firm address (optional)</Label>
            <Input 
              id="firmAddress"
              placeholder="Enter firm address" 
              value={firmAddress}
              onChange={(e) => setFirmAddress(e.target.value)}
              className="flex h-10 w-full"
            />
          </div>
          
          {/* Admin Information - Required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="adminName"
                  placeholder="Enter admin name" 
                  className="pl-9" 
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="adminEmail"
                  placeholder="admin@example.com" 
                  className="pl-9" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  type="email"
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 