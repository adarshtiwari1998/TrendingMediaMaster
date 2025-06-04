import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircleIcon, ClockIcon } from "lucide-react";

interface VideoPreviewProps {
  videos: Array<{
    id: number;
    title: string;
    description?: string;
    script?: string;
    status: string;
    duration?: string;
    trendingTopic?: string;
    createdAt: string;
    publishedAt?: string;
    youtubeId?: string;
    views?: number;
  }>;
}

export default function VideoPreview({ videos }: VideoPreviewProps) {
  const currentVideo = videos?.find(video => video.status === "processing" || video.status === "completed") || videos?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlayCircleIcon className="w-5 h-5 mr-2" />
          Current Video Production
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {currentVideo ? (
          <div className="space-y-4">
            {/* Video Preview Placeholder */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {currentVideo.status === "processing" ? "Video being rendered..." : "Video ready for review"}
                </p>
                {currentVideo.status === "processing" && (
                  <div className="mt-3 w-32 mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Video Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {getStatusBadge(currentVideo.status)}
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Title:</span>
                <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">
                  {currentVideo.title}
                </p>
              </div>
              
              {currentVideo.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Duration:</span>
                  <span className="text-sm text-gray-900">{currentVideo.duration}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Format:</span>
                <span className="text-sm text-gray-900">1080p MP4</span>
              </div>
              
              {currentVideo.trendingTopic && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Based on:</span>
                  <span className="text-sm text-gray-900">{currentVideo.trendingTopic}</span>
                </div>
              )}
              
              {currentVideo.youtubeId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">YouTube ID:</span>
                  <a 
                    href={`https://youtube.com/watch?v=${currentVideo.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {currentVideo.youtubeId}
                  </a>
                </div>
              )}
              
              {currentVideo.views && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Views:</span>
                  <span className="text-sm text-gray-900">{currentVideo.views.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No videos in production</p>
              <p className="text-xs text-gray-400 mt-1">Next video will be created automatically</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
