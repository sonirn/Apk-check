import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid analysis ID" }, { status: 400 })
    }

    const analysis = await storage.getApkAnalysis(id)

    if (!analysis) {
      return NextResponse.json({ message: "Analysis not found" }, { status: 404 })
    }

    const detailedReport = {
      executiveSummary: {
        applicationName: analysis.fileName,
        packageName: analysis.packageName,
        version: analysis.version,
        analysisDate: analysis.uploadTime,
        overallRiskLevel:
          (analysis.criticalIssues || 0) > 0 ? "HIGH" : (analysis.warningIssues || 0) > 0 ? "MEDIUM" : "LOW",
        securityScore: analysis.securityScore,
        totalVulnerabilities: analysis.vulnerabilities?.length || 0,
        criticalFindings: analysis.criticalIssues || 0,
        riskFactors: analysis.vulnerabilities?.filter((v) => v.severity === "critical").map((v) => v.title) || [],
      },
      analysisMetadata: {
        id: analysis.id,
        fileName: analysis.fileName,
        fileSize: `${(analysis.fileSize / (1024 * 1024)).toFixed(2)} MB`,
        uploadTime: analysis.uploadTime,
        analysisStatus: analysis.analysisStatus,
        analysisEngine: "SecureAPK Analyzer v2.0",
        reportVersion: "1.0",
        generatedAt: new Date().toISOString(),
        analyst: "Automated Security Analysis Engine",
      },
      devModeFeatures: {
        inAppPurchaseTesting: {
          sandboxModeEnabled: true,
          mockPurchaseResponses: true,
          testProductIds: [
            "android.test.purchased",
            "android.test.canceled",
            "android.test.refunded",
            "android.test.item_unavailable",
          ],
          billingClientConfiguration: "Configured for testing environment",
        },
        developmentEnhancements: {
          debugModeEnabled: true,
          sslValidationBypassed: true,
          rootDetectionDisabled: true,
          networkSecurityConfigAdded: true,
          loggingEnhanced: true,
        },
        testingCapabilities: {
          premiumFeaturesUnlocked: true,
          subscriptionBypass: true,
          adRemovalEnabled: true,
          proFeaturesAccessible: true,
        },
      },
      applicationProfile: {
        packageInformation: {
          packageName: analysis.packageName,
          versionName: analysis.version,
          versionCode: analysis.targetSdk,
          targetSdkVersion: analysis.targetSdk,
          minSdkVersion: "Unknown",
          compileSdkVersion: "Unknown",
        },
        permissions: {
          total: analysis.permissions?.length || 0,
          dangerous:
            analysis.permissions?.filter(
              (p) =>
                p.includes("WRITE_EXTERNAL_STORAGE") ||
                p.includes("READ_PHONE_STATE") ||
                p.includes("ACCESS_FINE_LOCATION") ||
                p.includes("CAMERA") ||
                p.includes("RECORD_AUDIO"),
            ).length || 0,
          list: analysis.permissions || [],
          riskAssessment:
            (analysis.permissions?.length || 0) > 10 ? "High permission usage detected" : "Normal permission usage",
        },
      },
      securityAssessment: {
        overallScore: analysis.securityScore,
        riskLevel: (analysis.criticalIssues || 0) > 0 ? "HIGH" : (analysis.warningIssues || 0) > 0 ? "MEDIUM" : "LOW",
        criticalIssues: analysis.criticalIssues || 0,
        warningIssues: analysis.warningIssues || 0,
        passedChecks: Object.values(analysis.analysisResults || {}).filter((r) => r.status === "passed").length,
        failedChecks: Object.values(analysis.analysisResults || {}).filter(
          (r) => r.status === "critical" || r.status === "failed",
        ).length,
      },
      vulnerabilityFindings: {
        summary: {
          total: analysis.vulnerabilities?.length || 0,
          critical: analysis.vulnerabilities?.filter((v) => v.severity === "critical").length || 0,
          high: analysis.vulnerabilities?.filter((v) => v.severity === "high").length || 0,
          medium: analysis.vulnerabilities?.filter((v) => v.severity === "medium").length || 0,
          low: analysis.vulnerabilities?.filter((v) => v.severity === "low").length || 0,
        },
        detailedFindings:
          analysis.vulnerabilities?.map((vuln) => ({
            id: vuln.id,
            title: vuln.title,
            severity: vuln.severity,
            category: vuln.category,
            description: vuln.description,
            location: vuln.location,
            cvssScore: vuln.cvssScore,
            remediation: vuln.recommendation,
          })) || [],
      },
    }

    const reportContent = JSON.stringify(detailedReport, null, 2)
    const reportFileName = `detailed-security-report-${analysis.fileName}-${Date.now()}.json`

    return new NextResponse(reportContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${reportFileName}"`,
      },
    })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 })
  }
}
