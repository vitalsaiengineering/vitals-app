import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import axios from "axios";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import { getAllClients, Client } from "@/utils/clientDataUtils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const AskVitals = () => {
  const { useMock } = useMockData();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi there! I'm Vitals AI Assistant. How can I help you with your practice today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Function to get the highest grossing client from mock data
  const getHighestGrossingClient = () => {
    try {
      const clients = getAllClients();
      const highestAumClient = clients.reduce((highest: Client, current: Client) => {
        return current.aum > highest.aum ? current : highest;
      });
      return {
        name: highestAumClient.name,
        aum: highestAumClient.aum,
      };
    } catch (error) {
      console.error("Error getting highest grossing client:", error);
      return {
        name: "John Anderson",
        aum: 2500000, // Fallback values
      };
    }
  };

  // Function to get the fastest growing segment
  const getFastestGrowingSegment = () => {
    try {
      const clients = getAllClients();
      
      // For this mock implementation, we'll just return a hardcoded result
      // In a real implementation, we would calculate growth rates from historical data
      const segments = {
        "Platinum": 18.5,
        "Gold": 12.3,
        "Silver": 7.8
      };
      
      // Find the segment with the highest growth rate
      const fastestSegment = Object.entries(segments).reduce(
        (fastest, [segment, growth]) => 
          growth > fastest.growth ? { segment, growth } : fastest,
        { segment: "", growth: 0 }
      );
      
      return {
        segment: fastestSegment.segment,
        growthRate: fastestSegment.growth
      };
    } catch (error) {
      console.error("Error getting fastest growing segment:", error);
      return {
        segment: "Platinum",
        growthRate: 15.2
      };
    }
  };
  
  // Function to get average client age
  const getAverageClientAge = () => {
    try {
      const clients = getAllClients();
      const totalAge = clients.reduce((sum: number, client: Client) => sum + client.age, 0);
      const averageAge = totalAge / clients.length;
      
      return {
        averageAge: Math.round(averageAge * 10) / 10 // Round to 1 decimal place
      };
    } catch (error) {
      console.error("Error calculating average client age:", error);
      return {
        averageAge: 52.7 // Fallback value
      };
    }
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      // if (useMock) {
        // Mock interaction with 2-3 second delay
        const delay = 2000 + Math.random() * 1000; // 2-3 seconds

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Check for specific questions and provide appropriate responses
        const lowerCaseQuery = userMessage.content.toLowerCase();
        let responseContent = "";
        
        if (lowerCaseQuery.includes("highest grossing") || lowerCaseQuery.includes("top client")) {
          // Get highest grossing client data
          const highestClient = getHighestGrossingClient();
          responseContent = `Your highest grossing client is ${
            highestClient.name
          } with an AUM of ${formatCurrency(highestClient.aum)}.`;
        } 
        else if (lowerCaseQuery.includes("segment") && 
                (lowerCaseQuery.includes("growing") || lowerCaseQuery.includes("fastest"))) {
          // Get fastest growing segment
          const fastestSegment = getFastestGrowingSegment();
          responseContent = `Your ${fastestSegment.segment} segment is growing the fastest at ${fastestSegment.growthRate}% year-over-year.`;
        }
        else if (lowerCaseQuery.includes("average") && lowerCaseQuery.includes("age")) {
          // Get average client age
          const ageData = getAverageClientAge();
          responseContent = `The average age of your clients is ${ageData.averageAge} years.`;
        }
        else {
          // Default response for other queries
          const highestClient = getHighestGrossingClient();
          responseContent = `Your highest grossing client is ${
            highestClient.name
          } with an AUM of ${formatCurrency(highestClient.aum)}.`;
        }

        const mockResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
        };

        setMessages((prev) => [...prev, mockResponse]);
      // } else {
      //   // Attempt to send the query to the backend
      //   const response = await axios.post("/api/ai/query", {
      //     query: userMessage.content,
      //   });

      //   const aiMessage: Message = {
      //     id: (Date.now() + 1).toString(),
      //     role: "assistant",
      //     content:
      //       response.data.response ||
      //       "I apologize, but I couldn't process that request.",
      //   };

      //   setMessages((prev) => [...prev, aiMessage]);
      // }
    } catch (error) {
      console.error("Error querying AI:", error);

      if (!useMock) {
        // Fallback to mock response if API fails
        const delay = 2000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const highestClient = getHighestGrossingClient();

        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Your highest grossing client is ${
            highestClient.name
          } with an AUM of ${formatCurrency(highestClient.aum)}.`,
        };

        setMessages((prev) => [...prev, fallbackMessage]);
      } else {
        // Error in mock mode
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I apologize, but I'm having trouble processing that request right now. Please try again.",
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ask Vitals AI</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask a question about your practice..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !query.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
