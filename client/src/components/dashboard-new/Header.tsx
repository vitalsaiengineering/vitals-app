import React, { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import axios from "axios";
import { useAdvisor } from "@/contexts/AdvisorContext";

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export const Header = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { selectedAdvisor, setSelectedAdvisor, advisorList } = useAdvisor();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/me");
        if (response.data) {
          // Transform the data to match the UserProfile interface with full name
          let fullName = "";

          // Try to get the full name from various possible fields
          if (response.data.name) {
            fullName = response.data.name;
          } else if (response.data.first_name && response.data.last_name) {
            fullName = `${response.data.first_name} ${response.data.last_name}`;
          } else if (response.data.firstName && response.data.lastName) {
            fullName = `${response.data.firstName} ${response.data.lastName}`;
          } else if (response.data.firstName && !response.data.last_name) {
            fullName = `${response.data.firstName}`;
          } else if (response.data.display_name) {
            fullName = response.data.display_name;
          } else {
            // If no name fields are available, use the username or email prefix
            fullName =
              response.data.username || response.data.email.split("@")[0];
          }

          const userData: UserProfile = {
            id: response.data.id,
            username:
              response.data.username || response.data.email.split("@")[0],
            name: fullName,
            email: response.data.email,
            role: response.data.role || "user",
          };
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      // Even if the API fails, still redirect to login
      navigate("/login");
    }
  };

  const handleAdvisorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAdvisor(e.target.value);
  };

  return (
    <header className="bg-white border-b h-16 px-6 flex items-center justify-between">
      {/* <div className="flex-1 flex items-center">
        <div className="relative mr-4 w-64">
          <Input placeholder="Search..." className="pl-9 h-9" />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div> */}

<div className="flex-1 flex items-center justify-end">
  <div className="relative">
            <select 
              className="pl-3 pr-8 py-1.5 rounded border appearance-none focus:outline-none focus:ring-1 focus:ring-vitals-lightBlue text-sm"
              value={selectedAdvisor}
              onChange={handleAdvisorChange}
            >
              {advisorList.map(advisor => (
                <option key={advisor} value={advisor}>{advisor}</option>
              ))}
            </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 10l5 5 5-5H7z" />
                </svg>
              </div>
            </div>
            </div>
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
        </Button> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 relative h-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>
                  {loading ? "..." : user ? getInitials(user.name) : "GU"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {loading ? "Loading..." : user ? user.name : "Guest User"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
    </header>
  );
};
