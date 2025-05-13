
import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const AskVitals = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi there! I\'m Vitals AI assistant. Ask me anything about your client data, performance metrics, or reports.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefilled queries
  const prefilledQueries = [
    "How has my AUM changed this year?",
    "What multiples are firms currently selling for in my space?"
  ];

  // Simulate sending a message to the AI
  const handleSend = (message: string = input) => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: message
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate AI response after 1 second
    setTimeout(() => {
      let response = "";
      
      if (message.toLowerCase().includes("aum") && message.toLowerCase().includes("changed")) {
        response = "Your AUM has grown by 12.4% this year, from $24.9M to $28M. This growth is primarily driven by market performance (8.2%) and new client acquisitions (4.2%).";
      } else if (message.toLowerCase().includes("multiple") && message.toLowerCase().includes("selling")) {
        response = "Currently, RIA firms in your space are selling for 2.5-3.5x revenue multiples. Firms with higher growth rates and more diverse client bases are commanding the higher end of that range.";
      } else {
        const responseOptions = [
          "Based on your client data, the average account growth this quarter is 4.2%, which is 1.5% above industry average.",
          "I analyzed your recent client acquisitions. You've gained 12 new clients in the last 30 days, a 15% increase from the previous period.",
          "Looking at the AUM breakdown, your Silver tier clients have shown the highest growth rate at 5.3% this month."
        ];
        response = responseOptions[Math.floor(Math.random() * responseOptions.length)];
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border rounded-lg flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageSquare size={18} className="text-vitals-blue" />
        <h3 className="font-medium">Ask Vitals</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div 
              key={i} 
              className={`${
                message.role === 'assistant' 
                  ? 'bg-vitals-gray rounded-lg p-3' 
                  : 'bg-vitals-blue/10 rounded-lg p-3'
              }`}
            >
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="bg-vitals-gray rounded-lg p-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-vitals-blue" />
              <span className="text-muted-foreground">Vitals is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {messages.length === 1 && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-sm text-muted-foreground">Suggested questions:</p>
          <div className="grid gap-2">
            {prefilledQueries.map((query, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="justify-start text-left h-auto py-2 font-normal" 
                onClick={() => handleSend(query)}
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea 
            placeholder="What do you want to know about your practice?" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
          />
          <Button 
            size="icon" 
            disabled={!input.trim() || loading}
            onClick={() => handleSend()}
            className="bg-vitals-blue hover:bg-vitals-blue/80 text-white"
          >
            <Send size={18} />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
