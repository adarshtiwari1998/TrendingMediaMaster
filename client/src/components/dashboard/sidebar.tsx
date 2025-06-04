import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  VideoIcon,
  TrendingUpIcon,
  FileTextIcon,
  ImageIcon,
  UploadIcon,
  SettingsIcon,
  ChartLineIcon,
  ClockIcon,
  DatabaseIcon,
  YoutubeIcon,
  HardDriveIcon,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: ChartLineIcon,
    current: true,
  },
  {
    name: "Trending Analysis",
    href: "/trending",
    icon: TrendingUpIcon,
    current: false,
  },
  {
    name: "Script Generation",
    href: "/scripts",
    icon: FileTextIcon,
    current: false,
  },
  {
    name: "Video Creation",
    href: "/videos",
    icon: VideoIcon,
    current: false,
  },
  {
    name: "Thumbnails",
    href: "/thumbnails",
    icon: ImageIcon,
    current: false,
  },
  {
    name: "Publishing Queue",
    href: "/publishing",
    icon: UploadIcon,
    current: false,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    current: false,
  },
];

const integrations = [
  {
    name: "Gemini API",
    status: "connected",
    icon: "🔮",
  },
  {
    name: "YouTube API",
    status: "connected",
    icon: "📺",
  },
  {
    name: "Google Drive",
    status: "connected",
    icon: "💾",
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <VideoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AutoTube</h1>
            <p className="text-sm text-gray-500">Video Automation</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isCurrent = location === item.href || (item.href === "/" && location === "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isCurrent
                    ? "text-primary bg-blue-50 border-l-4 border-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Integrations
          </h3>
          <div className="space-y-2">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center px-4 py-2 bg-green-50 rounded-lg"
              >
                <span className="mr-3 text-lg">{integration.icon}</span>
                <span className="text-sm text-green-700 flex-1">{integration.name}</span>
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
