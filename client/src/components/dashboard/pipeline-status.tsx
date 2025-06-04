import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUpIcon,
  FileTextIcon,
  VideoIcon,
  ImageIcon,
  UploadIcon,
  CheckIcon,
  LoaderIcon,
  ClockIcon,
} from "lucide-react";

interface PipelineStatusProps {
  status?: {
    currentJobs: Array<{
      id: number;
      type: string;
      status: string;
      progress?: number;
    }>;
    nextScheduled?: {
      title: string;
      scheduledAt: string;
    };
    isActive: boolean;
  };
}

export default function PipelineStatus({ status }: PipelineStatusProps) {
  const steps = [
    {
      name: "Trending News Analysis",
      description: "AI-powered trending news analysis using Gemini",
      icon: TrendingUpIcon,
      status: "completed",
      progress: 100,
      detail: "Analyzed 247 trending topics",
    },
    {
      name: "Script Generation",
      description: "Generating engaging script using Gemini AI",
      icon: FileTextIcon,
      status: "running",
      progress: 75,
      detail: "75% complete • ETA: 2 minutes",
    },
    {
      name: "Video Creation",
      description: "Text-to-speech, effects, and video compilation",
      icon: VideoIcon,
      status: "pending",
      progress: 0,
      detail: "Waiting for script completion",
    },
    {
      name: "Thumbnail Generation",
      description: "AI-generated clickable thumbnails",
      icon: ImageIcon,
      status: "pending",
      progress: 0,
      detail: "Waiting for video completion",
    },
    {
      name: "Auto Publishing",
      description: "Upload to YouTube at optimal time",
      icon: UploadIcon,
      status: "scheduled",
      progress: 0,
      detail: "Scheduled for: Today at 6:00 PM IST",
    },
  ];

  const getStatusIcon = (stepStatus: string, progress: number) => {
    switch (stepStatus) {
      case "completed":
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case "running":
        return <LoaderIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case "scheduled":
        return <ClockIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return "bg-green-100";
      case "running":
        return "bg-blue-100";
      case "scheduled":
        return "bg-orange-100";
      default:
        return "bg-gray-100";
    }
  };

  const getProgressColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Automation Pipeline</span>
          <Badge variant={status?.isActive ? "default" : "secondary"}>
            {status?.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <p className="text-gray-600 text-sm">Real-time status of your video creation process</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.name} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 ${getStatusColor(step.status)} rounded-full flex items-center justify-center`}>
                  {getStatusIcon(step.status, step.progress)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
                    <Badge 
                      variant={step.status === "completed" ? "default" : step.status === "running" ? "secondary" : "outline"}
                    >
                      {step.status === "completed" ? "Completed" : 
                       step.status === "running" ? "In Progress" : 
                       step.status === "scheduled" ? "Scheduled" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  
                  {step.progress > 0 && (
                    <div className="mt-3">
                      <Progress value={step.progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{step.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
