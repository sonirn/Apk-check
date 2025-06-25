import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { storage } from "@/server/storage"
import { APKAnalyzer } from "@/server/apk-analyzer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("apk") as File

    if (!file) {
      return NextResponse.json({ message: "No APK file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".apk") && file.type !== "application/vnd.android.package-archive") {
      return NextResponse.json({ message: "Only APK files are allowed" }, { status: 400 })
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ message: "File size must be less than 100MB" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(uploadsDir, fileName)

    await writeFile(filePath, buffer)

    // Create analysis record in database
    const analysis = await storage.createApkAnalysis({
      fileName: file.name,
      fileSize: file.size,
      analysisStatus: "analyzing",
      packageName: null,
      version: null,
      targetSdk: null,
      permissions: null,
      securityScore: null,
      criticalIssues: 0,
      warningIssues: 0,
      vulnerabilities: null,
      analysisResults: null,
      fixedApkPath: null,
    })

    // Start analysis in background
    performAnalysis(analysis.id, filePath, file.name).catch((error) => {
      console.error("Background analysis failed:", error)
      storage.updateApkAnalysis(analysis.id, { analysisStatus: "failed" }).catch(console.error)
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Failed to upload and analyze APK" }, { status: 500 })
  }
}

async function performAnalysis(analysisId: number, filePath: string, originalFileName: string) {
  try {
    console.log(`Starting analysis for ID: ${analysisId}`)

    // Initialize APK analyzer
    const analyzer = new APKAnalyzer(filePath)

    // Perform comprehensive analysis
    const analysisResult = await analyzer.analyzeAPK()

    // Calculate security score based on vulnerabilities
    const criticalCount = analysisResult.vulnerabilities.filter((v) => v.severity === "critical").length
    const highCount = analysisResult.vulnerabilities.filter((v) => v.severity === "high").length
    const mediumCount = analysisResult.vulnerabilities.filter((v) => v.severity === "medium").length
    const lowCount = analysisResult.vulnerabilities.filter((v) => v.severity === "low").length

    // Security score calculation (100 - penalty points)
    let securityScore = 100
    securityScore -= criticalCount * 25 // -25 for each critical
    securityScore -= highCount * 15 // -15 for each high
    securityScore -= mediumCount * 8 // -8 for each medium
    securityScore -= lowCount * 3 // -3 for each low
    securityScore = Math.max(0, securityScore) // Minimum 0

    // Extract package info
    const packageInfo = analysisResult.packageInfo || {}
    let packageName = null
    let version = null
    let targetSdk = null
    let permissions: string[] = []

    if (packageInfo.manifest) {
      const manifest = packageInfo.manifest
      if (manifest.$ && manifest.$.package) {
        packageName = manifest.$.package
      }
      if (manifest.$) {
        version = manifest.$["android:versionName"] || manifest.$["versionName"]
        targetSdk = Number.parseInt(manifest.$["android:targetSdkVersion"] || manifest.$["targetSdkVersion"]) || null
      }

      // Extract permissions
      if (manifest["uses-permission"]) {
        permissions = manifest["uses-permission"]
          .map((perm: any) => {
            return perm.$["android:name"] || perm.$.name || ""
          })
          .filter(Boolean)
      }
    }

    // Update analysis with results
    await storage.updateApkAnalysis(analysisId, {
      analysisStatus: "completed",
      packageName,
      version,
      targetSdk,
      permissions,
      securityScore,
      criticalIssues: criticalCount,
      warningIssues: highCount + mediumCount + lowCount,
      vulnerabilities: analysisResult.vulnerabilities,
      analysisResults: analysisResult.analysisResults,
      fixedApkPath: analysisResult.fixedApkPath,
    })

    console.log(`Analysis completed successfully for ID: ${analysisId}`)
  } catch (error) {
    console.error(`Analysis failed for ID: ${analysisId}:`, error)
    await storage.updateApkAnalysis(analysisId, {
      analysisStatus: "failed",
    })
  }
}
