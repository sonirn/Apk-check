import { Link, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Upload, Search, FileText, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ApkAnalysis } from "@shared/schema";

const sidebarItems = [
  { icon: Upload, label: "Upload APK", href: "/", active: true },
  { icon: Search, label: "Analysis Results", href: "/analysis" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: History, label: "Scan History", href: "/history" },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: analyses } = useQuery<ApkAnalysis[]>({
    queryKey: ['/api/analyses'],
  });

  const currentScan = analyses?.find(analysis => analysis.analysisStatus === "analyzing");

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 hidden lg:block">
      <div className="p-6">
        <div className="space-y-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 text-blue-600 dark:text-blue-400" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Current Scan Progress */}
        {currentScan && (
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Scan</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between mb-2">
                <span>Progress:</span>
                <span className="font-medium">Analyzing...</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Processing {currentScan.fileName}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
