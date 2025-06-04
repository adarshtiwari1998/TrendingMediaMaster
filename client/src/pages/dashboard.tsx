import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import PipelineStatus from "@/components/dashboard/pipeline-status";
import TrendingTopics from "@/components/dashboard/trending-topics";
import VideoPreview from "@/components/dashboard/video-preview";
import ProductionQueue from "@/components/dashboard/production-queue";
import QuickActions from "@/components/dashboard/quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { PlayIcon, PauseIcon } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [isAutomationActive, setIsAutomationActive] = useState(true);

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["/api/videos"],
    refetchInterval: 30000,
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/trending-topics"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: pipelineStatus } = useQuery({
    queryKey: ["/api/pipeline/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: systemHealth } = useQuery({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  const handleManualTrigger = async () => {
    try {
      await apiRequest("POST", "/api/manual/news-analysis");
      toast({
        title: "Analysis Started",
        description: "Manual news analysis has been triggered successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start manual analysis.",
        variant: "destructive",
      });
    }
  };

  const toggleAutomation = () => {
    setIsAutomationActive(!isAutomationActive);
    toast({
      title: isAutomationActive ? "Automation Paused" : "Automation Resumed",
      description: `Automation has been ${isAutomationActive ? "paused" : "resumed"}.`,
    });
  };

  if (statsLoading || videosLoading || topicsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your automated video creation pipeline</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  isAutomationActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className={`text-sm font-medium ${
                  isAutomationActive ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {isAutomationActive ? 'Automation Active' : 'Automation Paused'}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutomation}
                className="flex items-center space-x-2"
              >
                {isAutomationActive ? (
                  <>
                    <PauseIcon className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    <span>Resume</span>
                  </>
                )}
              </Button>
              
              <Button onClick={handleManualTrigger} className="flex items-center space-x-2">
                <PlayIcon className="w-4 h-4" />
                <span>Run Manual Process</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8 overflow-y-auto h-full">
          {/* Stats Overview */}
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Pipeline Status */}
            <div className="lg:col-span-2">
              <PipelineStatus status={pipelineStatus} />
            </div>

            {/* System Health */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemHealth && Object.entries(systemHealth).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={status ? "default" : "destructive"}>
                        {status ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Trending Topics */}
            <TrendingTopics topics={topics || []} />

            {/* Video Preview */}
            <VideoPreview videos={videos || []} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Production Queue */}
            <div className="xl:col-span-2">
              <ProductionQueue videos={videos || []} />
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </div>
        </main>
      </div>
    </div>
  );
}
