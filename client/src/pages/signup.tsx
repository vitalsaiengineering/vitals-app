import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  ShieldCheckIcon,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackgroundGradient from "@/components/BackgroundGradient";
import VitalsLogo from "@/components/VitalsLogo";
import { signup } from "@/lib/api";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // organizationName: string;
  referralSource: string;
  antiBot: boolean;
}

const SignupForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // organizationName: "",
    referralSource: "",
    antiBot: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // --- Move useMutation hook here ---
  const createUserMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      toast({
        title: "Account created successfully",
        description: "Welcome aboard! Your account has been created.",
      });
      // Redirect on success
      setLocation('/dashboard');
    },
    onError: (error) => { // It's good practice to log the error
      console.error("Signup Error:", error);
      
      toast({
        title: "Signup Error",
        description:
          error.message,
        variant: "destructive",
      });
    },
    // Tanstack Query handles loading state via createUserMutation.isPending
    // onSettled: () => {
    //   setIsLoading(false); // No longer needed if using isPending
    // }
  });
  // --- End of moved hook ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReferralChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      referralSource: value,
    }));
  };

  const handleAntiBotChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      antiBot: checked,
    }));
  };

  const validateForm = () => {
    if (formData.name.trim().length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (formData.referralSource.trim().length === 0) {
      toast({
        title: "Validation Error",
        description: "Please tell us how you heard about us",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.antiBot) {
      toast({
        title: "Verification Required",
        description: "Please confirm you're not a bot",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Don't need to manually set isLoading if using createUserMutation.isPending
    // setIsLoading(true);

    // Call the mutate function from the hook defined above
    createUserMutation.mutate(formData);

    // Remove manual setIsLoading(false) and setTimeout redirect
    // setIsLoading(false);
    // setTimeout(() => {
    //   setLocation("/dashboard");
    // }, 1000);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Use createUserMutation.isPending for loading state in the button
  const isLoading = createUserMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Personal Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-normal">
              Full Name
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="pl-10 h-12 text-base"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-normal">
              Email Address
            </Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 h-12 text-base"
                placeholder="name@example.com"
              />
            </div>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="organization" className="text-base font-normal">
              Organization Name
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="organization"
                name="organization"
                value={formData.organizationName}
                onChange={handleChange}
                className="pl-10 h-12 text-base"
                placeholder="Enter organization name"
              />
            </div>
          </div> */}
        </div>

        {/* Password Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-normal">
              Create a password
            </Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 h-12 text-base"
                placeholder="Create a secure password"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Must be at least 8 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base font-normal">
              Confirm password
            </Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={cn(
                  "pl-10 pr-10 h-12 text-base",
                  formData.confirmPassword &&
                    formData.password !== formData.confirmPassword &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                placeholder="Confirm your password"
              />
            </div>
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <CheckIcon className="h-3 w-3 mr-1" /> Passwords match
                </div>
              )}
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <div className="text-xs text-destructive mt-1">
                  Passwords don't match
                </div>
              )}
          </div>
        </div>

        {/* Referral Source - Dropdown */}
        <div className="space-y-3">
          <Label htmlFor="referralSource" className="text-base font-normal">
            How did you hear about us?
          </Label>
          <Select
            value={formData.referralSource}
            onValueChange={handleReferralChange}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="search_engine">Search Engine</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="advertisement">Advertisement</SelectItem>
              <SelectItem value="referral">
                Friend/Colleague Referral
              </SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Anti-Bot Security Verification */}
        <div className="space-y-4 border rounded-lg p-5 bg-accent/30">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Security Verification</h3>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="antiBot"
              checked={formData.antiBot}
              onCheckedChange={handleAntiBotChange}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="antiBot" className="cursor-pointer text-base">
                I confirm I am a human and not a bot
              </Label>
              <p className="text-sm text-muted-foreground">
                This helps us prevent automated signups and protect our
                community
              </p>
            </div>
          </div>
        </div>

        {/* Update Button disabled and loading state */}
        <Button type="submit" className="w-full h-12 mt-8" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Account...
            </div>
          ) : (
            "Create Account"
          )}
        </Button>
      </motion.div>
    </form>
  );
};

// Wrap SignupForm in a Signup component to maintain expected naming conventions
export default function Signup() {
  return (
    <>
      <BackgroundGradient />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="fixed top-6 left-6">
          <Link to="/">
            <VitalsLogo variant="extra-large" showText={false} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-10 shadow-xl"
        >
          <div className="text-center mb-8">
            <motion.h1
              className="text-2xl sm:text-3xl font-medium tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Create your account
            </motion.h1>
            <motion.p
              className="text-muted-foreground mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Join Vitals AI to start managing your clients more efficiently
            </motion.p>
          </div>

          <SignupForm />

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
