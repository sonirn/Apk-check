import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Eye, 
  FileText,
  Calendar,
  Package,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ApkAnalysis } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: analyses, isLoading } = useQuery<ApkAnalysis[]>({
    queryKey: ['/api/analyses'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/analyses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete analysis.",
        variant: "destructive",
      });
    },
  });

  const handleExportReport = async (analysis: ApkAnalysis) => {
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download-report`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed-security-report-${analysis.fileName}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Detailed security report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the security report.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFixedAPK = async (analysis: ApkAnalysis) => {
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download-fixed`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dev mode APK not ready yet. Please wait for analysis to complete.');
        }
        throw new Error('Failed to download dev mode APK');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dev_mode_${analysis.fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dev Mode APK Downloaded",
        description: "APK with developer mode features enabled for testing has been downloaded successfully. Install on device for comprehensive testing.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Dev mode APK is not available or download failed.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'analyzing':
        return <div className="h-4 w-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { label: "Completed", className: "status-safe" },
      analyzing: { label: "Analyzing", className: "status-warning" },
      failed: { label: "Failed", className: "status-critical" },
      pending: { label: "Pending", className: "status-info" },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getSeverityColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Security Analysis Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your APK security analysis reports
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Analysis History
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Package className="h-4 w-4" />
                <span>{analyses?.length || 0} analyses</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analyses && analyses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Security Score</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(analysis.analysisStatus)}
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {analysis.fileName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {(analysis.fileSize / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(analysis.analysisStatus)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(analysis.uploadTime!).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span className={`font-medium ${getSeverityColor(analysis.securityScore)}`}>
                              {analysis.securityScore !== null ? `${analysis.securityScore}/100` : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {analysis.criticalIssues > 0 && (
                              <Badge className="status-critical text-xs">
                                {analysis.criticalIssues} Critical
                              </Badge>
                            )}
                            {analysis.warningIssues > 0 && (
                              <Badge className="status-warning text-xs">
                                {analysis.warningIssues} Warnings
                              </Badge>
                            )}
                            {analysis.criticalIssues === 0 && analysis.warningIssues === 0 && analysis.analysisStatus === 'completed' && (
                              <Badge className="status-safe text-xs">Clean</Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {analysis.packageName ? (
                              <code className="text-blue-600 dark:text-blue-400 text-xs">
                                {analysis.packageName}
                              </code>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/analysis/${analysis.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportReport(analysis)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </DropdownMenuItem>
                              {analysis.analysisStatus === 'completed' && (
                                <DropdownMenuItem onClick={() => handleDownloadFixedAPK(analysis)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Dev Mode APK
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(analysis.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No Reports Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload an APK file to generate your first security analysis report
                </p>
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Package className="h-4 w-4 mr-2" />
                    Upload APK
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
