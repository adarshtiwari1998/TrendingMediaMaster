import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, ExternalLinkIcon, PlayCircleIcon, ClockIcon } from "lucide-react";

interface ProductionQueueProps {
  videos: Array<{
    id: number;
    title: string;
    status: string;
    duration?: string;
    createdAt: string;
    publishedAt?: string;
    scheduledAt?: string;
    youtubeId?: string;
    views?: number;
    likes?: number;
  }>;
}

export default function ProductionQueue({ videos }: ProductionQueueProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "completed":
        return <Badge className="bg-yellow-100 text-yellow-800">Ready</Badge>;
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <ExternalLinkIcon className="w-4 h-4 text-green-600" />;
      case "processing":
        return <PlayCircleIcon className="w-4 h-4 text-blue-600" />;
      case "scheduled":
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const recentVideos = videos?.slice(0, 10) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <PlayCircleIcon className="w-5 h-5 mr-2" />
            Production Queue
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {recentVideos.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No videos in queue</p>
            <p className="text-sm text-gray-400 mt-1">Videos will appear here as they are created</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center mr-4">
                          {getStatusIcon(video.status)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {video.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {video.duration || "Processing..."}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(video.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {video.views ? video.views.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.publishedAt 
                        ? formatDate(video.publishedAt)
                        : video.scheduledAt
                        ? `Scheduled: ${formatDate(video.scheduledAt)}`
                        : formatDate(video.createdAt)
                      }
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {video.youtubeId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                          >
                            <ExternalLinkIcon className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            View
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVerticalIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
