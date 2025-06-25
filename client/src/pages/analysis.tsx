"use client"

import { useParams } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Download, FileCode, Shield, AlertTriangle, Smartphone, TestTube } from "lucide-react"
import { Link } from "wouter"
import Sidebar from "@/components/sidebar"
import VulnerabilityDetails from "@/components/vulnerability-details"
import { securityCategories } from "@/lib/security-data"
import type { ApkAnalysis } from "@shared/schema"

export default function Analysis() {
  const { id } = useParams()

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery<ApkAnalysis>({
    queryKey: ["/api/analyses", id],
    enabled: !!id,
  })

  const handleExportReport = () => {
    if (!analysis) return

    const report = {
      analysis,
      timestamp: new Date().toISOString(),
      categories: securityCategories,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-report-${analysis.fileName}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadDevModeApk = async () => {
    if (!analysis?.id) return

    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download-fixed`)
      if (!response.ok) {
        throw new Error("Failed to download dev mode APK")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dev-mode-${analysis.fileName}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading dev mode APK:", error)
      alert("Failed to download dev mode APK. Please try again.")
    }
  }

  const handleDownloadDetailedReport = async () => {
    if (!analysis?.id) return

    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download-report`)
      if (!response.ok) {
        throw new Error("Failed to download detailed report")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `detailed-security-report-${analysis.fileName}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading detailed report:", error)
      alert("Failed to download detailed report. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Analysis Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The requested analysis could not be found or has been deleted.
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Security Analysis</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {analysis.fileName} • {new Date(analysis.uploadTime!).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button
              onClick={handleDownloadDetailedReport}
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Detailed Report
            </Button>
            {analysis.analysisStatus === "completed" && (
              <Button onClick={handleDownloadDevModeApk} className="bg-green-600 hover:bg-green-700 text-white">
                <Smartphone className="h-4 w-4 mr-2" />
                Download Dev Mode APK
              </Button>
            )}
          </div>
        </div>

        {/* Analysis Status */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FileCode className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Analysis Status:</span>
                </div>
                <Badge
                  className={
                    analysis.analysisStatus === "completed"
                      ? "status-safe"
                      : analysis.analysisStatus === "analyzing"
                        ? "status-warning"
                        : analysis.analysisStatus === "failed"
                          ? "status-critical"
                          : "status-info"
                  }
                >
                  {analysis.analysisStatus.toUpperCase()}
                </Badge>
              </div>

              {analysis.securityScore !== null && (
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-safe" />
                  <span className="text-lg font-bold text-safe">{analysis.securityScore}/100</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dev Mode APK Info */}
        {analysis.analysisStatus === "completed" && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 shadow-sm border border-green-200 dark:border-green-700 mb-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-bold text-green-800 dark:text-green-200">Developer Mode APK Ready</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-green-700 dark:text-green-300">
                  A developer-friendly version of your APK has been generated with the following enhancements:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">🛍️ In-App Purchase Testing</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Sandbox mode enabled for Google Play Billing</li>
                      <li>• Mock purchase responses for testing</li>
                      <li>• Test product IDs pre-configured</li>
                      <li>• Purchase validation bypass for development</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">🔧 Development Features</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Debug mode enabled for detailed logging</li>
                      <li>• SSL certificate validation bypassed</li>
                      <li>• Root detection disabled</li>
                      <li>• Network security config for local testing</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Important:</strong> This dev mode APK is for testing purposes only. Do not distribute or
                    use in production environments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {analysis.analysisStatus === "completed" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</p>
                    <p className="text-3xl font-bold text-critical">{analysis.criticalIssues || 0}</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-critical" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
                    <p className="text-3xl font-bold text-warning">{analysis.warningIssues || 0}</p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size</p>
                    <p className="text-3xl font-bold text-info">{(analysis.fileSize / (1024 * 1024)).toFixed(1)}MB</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <FileCode className="h-6 w-6 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Package Information */}
        {analysis.packageName && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Package Information</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Package Name:</span>
                    <code className="text-blue-600 dark:text-blue-400">{analysis.packageName}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span>{analysis.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Target SDK:</span>
                    <span>{analysis.targetSdk}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</h4>
                  <div className="space-y-1">
                    {analysis.permissions?.slice(0, 5).map((permission, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            permission.includes("INTERNET")
                              ? "bg-critical"
                              : permission.includes("CAMERA") || permission.includes("LOCATION")
                                ? "bg-warning"
                                : "bg-safe"
                          }`}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{permission}</span>
                      </div>
                    ))}
                    {analysis.permissions && analysis.permissions.length > 5 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        +{analysis.permissions.length - 5} more permissions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vulnerability Details */}
        {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 && (
          <VulnerabilityDetails vulnerabilities={analysis.vulnerabilities} />
        )}
      </main>
    </div>
  )
}
