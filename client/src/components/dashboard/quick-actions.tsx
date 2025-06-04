import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  TrendingUpIcon,
  PlayIcon,
  UploadIcon,
  SettingsIcon,
  MicIcon,
  RefreshCwIcon,
  ZapIcon,
} from "lucide-react";

export default function QuickActions() {
  const { toast } = useToast();

  const handleNewsAnalysis = async () => {
    try {
      await apiRequest("POST", "/api/manual/news-analysis");
      toast({
        title: "Analysis Started",
        description: "Manual news analysis has been triggered.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start news analysis.",
        variant: "destructive",
      });
    }
  };

  const handleTestTTS = async () => {
    try {
      const result = await apiRequest("POST", "/api/manual/test-tts", {
        text: "Hello, this is a test of the Indian English text-to-speech voice for our YouTube automation system."
      });
      toast({
        title: "TTS Test Completed",
        description: "Text-to-speech test was successful.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test text-to-speech.",
        variant: "destructive",
      });
    }
  };

  const handleCheckHealth = async () => {
    try {
      const health = await apiRequest("GET", "/api/system/health");
      const allHealthy = Object.values(health).every(status => status === true);
      
      toast({
        title: allHealthy ? "System Healthy" : "System Issues Detected",
        description: allHealthy 
          ? "All services are running normally."
          : "Some services may need attention. Check the system health panel.",
        variant: allHealthy ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Unable to check system health.",
        variant: "destructive",
      });
    }
  };

  const actions = [
    {
      title: "Run News Analysis",
      description: "Manual trigger",
      icon: TrendingUpIcon,
      onClick: handleNewsAnalysis,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Test TTS Voice",
      description: "Indian accent",
      icon: MicIcon,
      onClick: handleTestTTS,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Create Video Now",
      description: "Skip queue",
      icon: PlayIcon,
      onClick: () => toast({ title: "Feature Coming Soon", description: "Manual video creation will be available soon." }),
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Check System Health",
      description: "API status",
      icon: RefreshCwIcon,
      onClick: handleCheckHealth,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ZapIcon className="w-5 h-5 mr-2" />
          Quick Actions
        </CardTitle>
        <p className="text-gray-600 text-sm">Manage your automation workflow</p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={action.onClick}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Next Scheduled Run</h4>
          <p className="text-sm text-blue-600">Today at 6:00 PM IST</p>
          <p className="text-xs text-blue-500 mt-1">Auto-publish daily trending news video</p>
        </div>
      </CardContent>
    </Card>
  );
}
