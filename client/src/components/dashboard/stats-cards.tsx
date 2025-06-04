import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, VideoIcon, EyeIcon, ClockIcon } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    videosCreated: number;
    totalViews: string;
    successRate: string;
    queueCount: number;
    viewsGrowth?: string;
    successGrowth?: string;
    createdGrowth?: string;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const defaultStats = {
    videosCreated: 0,
    totalViews: "0",
    successRate: "0%",
    queueCount: 0,
    viewsGrowth: "+0%",
    successGrowth: "+0%",
    createdGrowth: "+0%",
  };

  const data = stats || defaultStats;

  const cards = [
    {
      title: "Videos Created",
      value: data.videosCreated.toString(),
      growth: data.createdGrowth || "+0%",
      icon: VideoIcon,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      title: "Total Views",
      value: data.totalViews,
      growth: data.viewsGrowth || "+0%",
      icon: EyeIcon,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Success Rate",
      value: data.successRate,
      growth: data.successGrowth || "+0%",
      icon: TrendingUpIcon,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Queue Status",
      value: data.queueCount.toString(),
      growth: "Videos pending",
      icon: ClockIcon,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-sm text-green-600 mt-2">
                    <TrendingUpIcon className="inline w-4 h-4 mr-1" />
                    {card.growth}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
