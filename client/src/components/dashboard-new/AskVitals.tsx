import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import axios from "axios";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import { getAllClients } from "@/utils/clientDataUtils.js";

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
      const highestAumClient = clients.reduce((highest, current) => {
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
      if (useMock) {
        // Mock interaction with 2-3 second delay
        const delay = 2000 + Math.random() * 1000; // 2-3 seconds

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Get highest grossing client data
        const highestClient = getHighestGrossingClient();

        const mockResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Your highest grossing client is ${
            highestClient.name
          } with an AUM of ${formatCurrency(highestClient.aum)}.`,
        };

        setMessages((prev) => [...prev, mockResponse]);
      } else {
        // Attempt to send the query to the backend
        const response = await axios.post("/api/ai/query", {
          query: userMessage.content,
        });

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            response.data.response ||
            "I apologize, but I couldn't process that request.",
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
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
