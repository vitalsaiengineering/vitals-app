import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAiQuery } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SUGGESTED_QUESTIONS = [
  "How many clients do I have in Texas?",
  "Who is my biggest client in Florida?",
  "What's my total assets under management?",
  "Show me my client demographics",
  "What's my current asset allocation?",
  "What's my average revenue per client?",
];

interface AiQueryProps {}

export function AiQuery({}: AiQueryProps) {
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: "user" | "ai"; content: string; data?: any }>>([]);
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: executeAiQuery,
    onSuccess: (data) => {
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: data.text, data: data.data },
      ]);
    },
    onError: () => {
      toast({
        title: "Query failed",
        description: "There was a problem processing your query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuerySubmit = (queryText: string) => {
    if (!queryText.trim() || queryMutation.isPending) return;

    setConversation((prev) => [
      ...prev,
      { role: "user", content: queryText },
    ]);
    queryMutation.mutate(queryText);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleQuerySubmit(query);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="p-4 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium">AI Query Assistant</CardTitle>
        <p className="text-sm text-neutral-500">Ask questions about your clients and portfolio</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-grow relative">
            <Input
              type="text"
              placeholder="Ask a question about your clients or portfolio..."
              className="pr-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={queryMutation.isPending}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute inset-y-0 right-0 pr-3"
              onClick={() => handleQuerySubmit(query)}
              disabled={!query.trim() || queryMutation.isPending}
            >
              <span className="material-icons text-primary-500">send</span>
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Suggested Questions</h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handleQuerySubmit(question)}
                disabled={queryMutation.isPending}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {conversation.length > 0 && (
          <div className="mt-4 border-t border-neutral-200 pt-4 space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm",
                      item.role === "user"
                        ? "bg-primary-100 text-primary-700"
                        : "bg-primary-600 text-white"
                    )}
                  >
                    <span className="material-icons text-sm">
                      {item.role === "user" ? "person" : "smart_toy"}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-neutral-700 font-medium">
                    {item.role === "user" ? "You:" : "AI Assistant:"}
                  </p>
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      item.role === "ai" ? "bg-neutral-50" : ""
                    )}
                  >
                    {item.content.split("\n").map((line, i) => (
                      <p key={i} className="text-sm text-neutral-700">
                        {line}
                        {i < item.content.split("\n").length - 1 && <br />}
                      </p>
                    ))}
                    {item.role === "ai" && item.data && (
                      <div className="mt-2 p-2 bg-neutral-100 rounded text-xs text-neutral-600">
                        {/* Client data */}
                        {item.data.client && (
                          <>
                            <div><strong>Client:</strong> {item.data.client.name}</div>
                            {item.data.client.aum && (
                              <div><strong>AUM:</strong> ${(item.data.client.aum / 1000000).toFixed(1)}M</div>
                            )}
                          </>
                        )}

                        {/* Demographics data */}
                        {item.data.demographics && (
                          <div className="mt-1">
                            <div><strong>Demographics:</strong></div>
                            {item.data.demographics.averageAge && (
                              <div>Average Age: {item.data.demographics.averageAge.toFixed(1)} years</div>
                            )}
                          </div>
                        )}

                        {/* Asset Allocation data */}
                        {item.data.assetAllocation && item.data.assetAllocation.length > 0 && (
                          <div className="mt-1">
                            <div><strong>Asset Allocation:</strong></div>
                            <div className="flex items-center gap-1 mt-1">
                              {item.data.assetAllocation.map((asset: any, i: number) => (
                                <div 
                                  key={i}
                                  className="h-2 rounded-sm" 
                                  style={{
                                    width: `${asset.percentage}%`,
                                    backgroundColor: 
                                      asset.class === "equities" ? "#4f46e5" :
                                      asset.class === "fixed income" ? "#10b981" :
                                      asset.class === "alternatives" ? "#f59e0b" :
                                      asset.class === "cash" ? "#6b7280" : "#94a3b8"
                                  }}
                                  title={`${asset.class}: ${asset.percentage.toFixed(1)}%`}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metrics Summary */}
                        {(item.data.totalAum !== undefined || item.data.totalRevenue !== undefined ||
                         item.data.averageAum !== undefined || item.data.averageRevenue !== undefined) && (
                          <div className="mt-1">
                            {item.data.totalAum !== undefined && (
                              <div><strong>Total AUM:</strong> ${(item.data.totalAum / 1000000).toFixed(1)}M</div>
                            )}
                            {item.data.totalRevenue !== undefined && (
                              <div><strong>Total Revenue:</strong> ${(item.data.totalRevenue / 1000).toFixed(1)}K</div>
                            )}
                            {item.data.averageAum !== undefined && (
                              <div><strong>Average AUM:</strong> ${(item.data.averageAum / 1000).toFixed(1)}K</div>
                            )}
                            {item.data.averageRevenue !== undefined && (
                              <div><strong>Average Revenue:</strong> ${(item.data.averageRevenue).toFixed(2)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {queryMutation.isPending && (
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm">
                    <span className="material-icons text-sm">smart_toy</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-neutral-700 font-medium">AI Assistant:</p>
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper for className conditionals
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
