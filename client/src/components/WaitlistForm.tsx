import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogClose } from "@/components/ui/dialog";
import { DrawerClose } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  firmName: z.string().min(2, {
    message: "Firm name must be at least 2 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const WaitlistForm = () => {
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<
    null | "success" | "error"
  >(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      firmName: "",
    },
  });

  const sendNotificationEmail = async (data: FormValues) => {
    setEmailSendStatus(null);
    console.log("Attempting to send email notification...");

    try {
      // Use Web3Forms for client-side email sending
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "c8b43fe3-0d07-4df3-babd-3a2014e9aa1c", // This is a public key for Web3Forms
          subject: "New Waitlist Signup for Vitals AI",
          from_name: `${data.fullName} from ${data.firmName}`,
          to_name: "Vitals AI Team",
          to: ["jack@advisorvitals.com", "mayank@advisorvitals.com"],
          message: `New waitlist signup:

Name: ${data.fullName}
Email: ${data.email}
Firm: ${data.firmName}

This message was sent from the Vitals AI waitlist form.`,
        }),
      });

      const result = await response.json();
      console.log("Email notification result:", result);

      if (result.success) {
        setEmailSendStatus("success");
        toast({
          title: "Email notification sent!",
          description: "The team has been notified of your submission.",
        });
        return true;
      } else {
        console.error("Email sending failed:", result);
        setEmailSendStatus("error");
        toast({
          title: "Email notification failed",
          description:
            "There was an issue sending the email notification. The team may not be notified.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
      setEmailSendStatus("error");
      toast({
        title: "Email notification failed",
        description:
          "There was an issue sending the email notification. The team may not be notified.",
        variant: "destructive",
      });
      return false;
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    console.log("Form submitted with data:", data);

    try {
      // This would typically be an API call to save the waitlist entry
      console.log("Processing waitlist submission...");

      // Send notification email
      const emailSent = await sendNotificationEmail(data);
      console.log("Email notification status:", emailSent ? "Sent" : "Failed");

      setIsSuccess(true);

      toast({
        title: "You've joined the waitlist!",
        description: "We'll notify you when Vitals AI launches.",
      });

      // Reset form after submission
      form.reset();
    } catch (error) {
      console.error("Error processing waitlist submission:", error);
      toast({
        title: "Submission Error",
        description:
          "There was a problem adding you to the waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-1">
          You're on the waitlist!
        </h3>
        <p className="text-gray-500 mb-3">
          Thank you for your interest in Vitals AI.
        </p>

        {emailSendStatus === "success" && (
          <div className="bg-green-50 p-4 rounded-lg mb-4 max-w-md">
            <p className="text-sm text-green-800">
              The team has been notified of your submission.
            </p>
          </div>
        )}

        {emailSendStatus === "error" && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-4 max-w-md">
            <p className="text-sm text-yellow-800">
              There was an issue sending the email notification. The team may
              not have been notified of your submission.
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg mb-4 max-w-md">
          <p className="text-sm text-blue-800">
            We'll contact you at the email address you provided as soon as
            Vitals AI goes live. In the meantime, we're working hard to bring
            you the best advisor intelligence platform possible.
          </p>
        </div>
        {isDesktop ? (
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        ) : (
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        )}
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firmName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firm Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Firm Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Join Waitlist"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WaitlistForm;
