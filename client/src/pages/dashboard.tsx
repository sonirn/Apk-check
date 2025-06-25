import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FileUpload from "@/components/file-upload";
import SecurityCard from "@/components/security-card";
import VulnerabilityDetails from "@/components/vulnerability-details";
import Sidebar from "@/components/sidebar";
import { securityCategories } from "@/lib/security-data";
import { Download, TriangleAlert, AlertCircle, Shield, FileCode, Package } from "lucide-react";
import type { ApkAnalysis } from "@shared/schema";

export default function Dashboard() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<ApkAnalysis | null>(null);

  const { data: analyses, isLoading } = useQuery<ApkAnalysis[]>({
    queryKey: ['/api/analyses'],
    refetchInterval: 5000, // Refetch every 5 seconds to update analysis status
  });

  const latestAnalysis = analyses?.[0];
  const completedAnalyses = analyses?.filter(a => a.analysisStatus === "completed") || [];

  const handleExportReport = async () => {
    if (!latestAnalysis) return;
    
    try {
      const response = await fetch(`/api/analyses/${latestAnalysis.id}/download-report`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed-security-report-${latestAnalysis.fileName}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* APK Upload Section */}
        <div className="mb-8">
          <FileUpload />
        </div>

        {/* Security Analysis Dashboard */}
        {latestAnalysis && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</p>
                      <p className="text-3xl font-bold text-critical">
                        {latestAnalysis.criticalIssues || 0}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                      <TriangleAlert className="h-6 w-6 text-critical" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
                      <p className="text-3xl font-bold text-warning">
                        {latestAnalysis.warningIssues || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Score</p>
                      <p className="text-3xl font-bold text-safe">
                        {latestAnalysis.securityScore || 0}/100
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <Shield className="h-6 w-6 text-safe" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Categories Grid */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    Security Analysis Categories
                  </h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleExportReport}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    {latestAnalysis.analysisStatus === 'completed' && (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/analyses/${latestAnalysis.id}/download-fixed`);
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `dev_mode_${latestAnalysis.fileName}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                          } catch (error) {
                            console.error('Download failed:', error);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Dev Mode APK
                      </Button>
                    )}
                  </div>
                </div>

                {latestAnalysis.analysisStatus === "completed" && latestAnalysis.analysisResults ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {securityCategories.map((category) => {
                      const result = latestAnalysis.analysisResults?.[category.id as keyof typeof latestAnalysis.analysisResults];
                      
                      return (
                        <SecurityCard
                          key={category.id}
                          icon={category.icon}
                          title={category.name}
                          description={category.description}
                          status={result?.status || "failed"}
                          issueCount={result?.issueCount || 0}
                          onClick={() => setSelectedAnalysis(latestAnalysis)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Analysis Section */}
            {latestAnalysis.analysisStatus === "completed" && (
              <div className="space-y-6">
                {/* APK Structure Analysis */}
                <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                      Detailed Analysis Results
                    </h2>
                    
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <FileCode className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          APK Structure Analysis
                        </h3>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Package Information
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Package Name:</span>
                                <code className="text-blue-600 dark:text-blue-400">
                                  {latestAnalysis.packageName || "N/A"}
                                </code>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                <span>{latestAnalysis.version || "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Target SDK:</span>
                                <span>{latestAnalysis.targetSdk || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Permissions
                            </h4>
                            <div className="space-y-1 text-sm">
                              {latestAnalysis.permissions?.slice(0, 5).map((permission, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    permission.includes('INTERNET') ? 'bg-critical' :
                                    permission.includes('CAMERA') || permission.includes('LOCATION') ? 'bg-warning' :
                                    'bg-safe'
                                  }`} />
                                  <span className="text-gray-600 dark:text-gray-400">{permission}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vulnerability Details */}
                {latestAnalysis.vulnerabilities && (
                  <VulnerabilityDetails vulnerabilities={latestAnalysis.vulnerabilities} />
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!latestAnalysis && !isLoading && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No APK Files Analyzed Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload an APK file to start your security analysis
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
