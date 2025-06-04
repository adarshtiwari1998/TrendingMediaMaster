import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { RefreshCwIcon, PlayIcon } from "lucide-react";

interface TrendingTopicsProps {
  topics: Array<{
    id: number;
    title: string;
    description: string;
    source: string;
    score: number;
    category: string;
    used: boolean;
    analyzedAt: string;
  }>;
}

export default function TrendingTopics({ topics }: TrendingTopicsProps) {
  const { toast } = useToast();

  const handleRefreshTopics = async () => {
    try {
      await apiRequest("POST", "/api/trending-topics/analyze");
      toast({
        title: "Analysis Started",
        description: "Trending topics analysis has been started. Results will appear shortly.",
      });
      // Refresh will happen automatically due to React Query
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start trending analysis.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateVideo = async (topicId: number) => {
    try {
      await apiRequest("POST", "/api/manual/create-video", { topicId });
      toast({
        title: "Video Creation Started",
        description: "Video creation process has been initiated for this topic.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start video creation.",
        variant: "destructive",
      });
    }
  };

  const sortedTopics = [...topics]
    .filter(topic => !topic.used)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Trending Analysis
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">AI-powered trending news analysis</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshTopics}
            className="flex items-center space-x-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {sortedTopics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No trending topics available</p>
              <Button 
                onClick={handleRefreshTopics}
                className="mt-4"
                size="sm"
              >
                Analyze Trending Topics
              </Button>
            </div>
          ) : (
            sortedTopics.map((topic, index) => (
              <div key={topic.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {topic.category}
                    </Badge>
                    <span className="text-xs text-gray-500">Score: {topic.score}/100</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{topic.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span>Source: {topic.source}</span>
                    <span>Updated: {new Date(topic.analyzedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerateVideo(topic.id)}
                  className="ml-4 flex items-center space-x-1"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>Generate</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
