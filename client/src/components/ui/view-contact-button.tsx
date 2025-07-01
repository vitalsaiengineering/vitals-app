import React from "react";
import { Button } from "./button";
import { ExternalLink } from "lucide-react";
import { getClientContactUrl } from "@/lib/utils";

interface ViewContactButtonProps {
  clientId?: string | number;
  wealthboxClientId?: string;
  orionClientId?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

/**
 * A reusable button component for viewing client contact details
 * 
 * @param clientId - The internal ID of the client (fallback)
 * @param wealthboxClientId - The Wealthbox client ID (preferred for CRM)
 * @param orionClientId - The Orion client ID (alternative)
 * @param size - Button size (default: "sm")
 * @param variant - Button variant (default: "default")
 * @param className - Additional CSS classes
 */
export const ViewContactButton: React.FC<ViewContactButtonProps> = ({
  clientId,
  wealthboxClientId,
  orionClientId,
  size = "sm",
  variant = "default",
  className = "",
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling if the button is inside a clickable container
    
    // Get the appropriate URL based on available IDs
    const url = getClientContactUrl(clientId, wealthboxClientId, orionClientId);
    
    // Open the URL in a new tab
    window.open(url, '_blank');
  };

  // Disable the button if no client ID is available
  const isDisabled = !clientId && !wealthboxClientId && !orionClientId;

  return (
    <Button 
      size={size} 
      variant={variant}
      onClick={handleClick}
      className={className}
      disabled={isDisabled}
      title={isDisabled ? "No client ID available" : "View client contact"}
    >
      View Contact
      <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
    </Button>
  );
};

export default ViewContactButton; 