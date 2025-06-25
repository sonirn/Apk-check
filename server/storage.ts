import { neon } from "@neondatabase/serverless"
import type { ApkAnalysis, SecurityCategory } from "@shared/schema"

const sql = neon(process.env.DATABASE_URL!)

export const storage = {
  async initializeDatabase() {
    try {
      console.log("Initializing database...")

      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS apk_analyses (
          id SERIAL PRIMARY KEY,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          analysis_status TEXT NOT NULL DEFAULT 'pending',
          package_name TEXT,
          version TEXT,
          target_sdk INTEGER,
          permissions JSONB,
          security_score INTEGER,
          critical_issues INTEGER DEFAULT 0,
          warning_issues INTEGER DEFAULT 0,
          vulnerabilities JSONB,
          analysis_results JSONB,
          fixed_apk_path TEXT,
          report_path TEXT
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS security_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Insert default categories
      const defaultCategories = [
        { name: "Reconnaissance", description: "Information gathering and enumeration", icon: "Search" },
        { name: "Subdomain Enumeration", description: "Subdomain discovery and analysis", icon: "Globe" },
        { name: "Port Scanning", description: "Network port discovery and analysis", icon: "Wifi" },
        { name: "Directory Enumeration", description: "Web directory and file discovery", icon: "Folder" },
        { name: "Vulnerability Scanning", description: "Automated vulnerability detection", icon: "Shield" },
        { name: "Manual Testing", description: "Manual security testing procedures", icon: "User" },
        { name: "Authentication Testing", description: "Authentication mechanism analysis", icon: "Lock" },
        { name: "Session Management", description: "Session handling security analysis", icon: "Clock" },
        { name: "Input Validation", description: "Input validation and sanitization", icon: "Edit" },
        { name: "SQL Injection", description: "SQL injection vulnerability testing", icon: "Database" },
        { name: "Cross-Site Scripting", description: "XSS vulnerability detection", icon: "Code" },
        { name: "CSRF", description: "Cross-Site Request Forgery testing", icon: "RefreshCw" },
        { name: "SSRF", description: "Server-Side Request Forgery analysis", icon: "Server" },
        { name: "IDOR", description: "Insecure Direct Object Reference testing", icon: "Key" },
        { name: "RCE", description: "Remote Code Execution vulnerability testing", icon: "Terminal" },
        { name: "File Inclusion", description: "File inclusion vulnerability analysis", icon: "FileText" },
        { name: "Clickjacking", description: "Clickjacking attack prevention analysis", icon: "MousePointer" },
        { name: "Rate Limiting", description: "Rate limiting and DoS protection", icon: "Timer" },
        { name: "Access Control", description: "Authorization and access control testing", icon: "UserCheck" },
        { name: "Business Logic", description: "Business logic vulnerability analysis", icon: "Briefcase" },
        { name: "API Testing", description: "API security testing and analysis", icon: "Zap" },
        { name: "Mobile App Testing", description: "Mobile application security testing", icon: "Smartphone" },
        { name: "Client-Side Vulnerabilities", description: "Client-side security analysis", icon: "Monitor" },
        { name: "Information Disclosure", description: "Information leakage analysis", icon: "Eye" },
        { name: "Server-Side Vulnerabilities", description: "Server-side security analysis", icon: "HardDrive" },
      ]

      for (const category of defaultCategories) {
        await sql`
          INSERT INTO security_categories (name, description, icon)
          VALUES (${category.name}, ${category.description}, ${category.icon})
          ON CONFLICT (name) DO NOTHING
        `
      }

      console.log("Database initialized successfully")
    } catch (error) {
      console.error("Failed to initialize database:", error)
      throw error
    }
  },

  async createApkAnalysis(data: Omit<ApkAnalysis, "id" | "uploadTime">): Promise<ApkAnalysis> {
    try {
      const result = await sql`
        INSERT INTO apk_analyses (
          file_name, file_size, analysis_status, package_name, version, target_sdk,
          permissions, security_score, critical_issues, warning_issues, 
          vulnerabilities, analysis_results, fixed_apk_path, report_path
        )
        VALUES (
          ${data.fileName}, ${data.fileSize}, ${data.analysisStatus}, ${data.packageName}, 
          ${data.version}, ${data.targetSdk}, ${JSON.stringify(data.permissions)}, 
          ${data.securityScore}, ${data.criticalIssues}, ${data.warningIssues}, 
          ${JSON.stringify(data.vulnerabilities)}, ${JSON.stringify(data.analysisResults)},
          ${data.fixedApkPath}, ${data.reportPath}
        )
        RETURNING *
      `

      const row = result[0]
      return this.mapRowToAnalysis(row)
    } catch (error) {
      console.error("Failed to create APK analysis:", error)
      throw error
    }
  },

  async updateApkAnalysis(id: number, data: Partial<ApkAnalysis>): Promise<void> {
    try {
      const updates = []
      const values = []
      let paramIndex = 1

      if (data.analysisStatus !== undefined) {
        updates.push(`analysis_status = $${paramIndex++}`)
        values.push(data.analysisStatus)
      }
      if (data.packageName !== undefined) {
        updates.push(`package_name = $${paramIndex++}`)
        values.push(data.packageName)
      }
      if (data.version !== undefined) {
        updates.push(`version = $${paramIndex++}`)
        values.push(data.version)
      }
      if (data.targetSdk !== undefined) {
        updates.push(`target_sdk = $${paramIndex++}`)
        values.push(data.targetSdk)
      }
      if (data.permissions !== undefined) {
        updates.push(`permissions = $${paramIndex++}`)
        values.push(JSON.stringify(data.permissions))
      }
      if (data.securityScore !== undefined) {
        updates.push(`security_score = $${paramIndex++}`)
        values.push(data.securityScore)
      }
      if (data.criticalIssues !== undefined) {
        updates.push(`critical_issues = $${paramIndex++}`)
        values.push(data.criticalIssues)
      }
      if (data.warningIssues !== undefined) {
        updates.push(`warning_issues = $${paramIndex++}`)
        values.push(data.warningIssues)
      }
      if (data.vulnerabilities !== undefined) {
        updates.push(`vulnerabilities = $${paramIndex++}`)
        values.push(JSON.stringify(data.vulnerabilities))
      }
      if (data.analysisResults !== undefined) {
        updates.push(`analysis_results = $${paramIndex++}`)
        values.push(JSON.stringify(data.analysisResults))
      }
      if (data.fixedApkPath !== undefined) {
        updates.push(`fixed_apk_path = $${paramIndex++}`)
        values.push(data.fixedApkPath)
      }
      if (data.reportPath !== undefined) {
        updates.push(`report_path = $${paramIndex++}`)
        values.push(data.reportPath)
      }

      if (updates.length > 0) {
        values.push(id)
        const query = `UPDATE apk_analyses SET ${updates.join(", ")} WHERE id = $${paramIndex}`
        await sql.unsafe(query, values)
      }
    } catch (error) {
      console.error("Failed to update APK analysis:", error)
      throw error
    }
  },

  async getApkAnalysis(id: number): Promise<ApkAnalysis | null> {
    try {
      const result = await sql`SELECT * FROM apk_analyses WHERE id = ${id}`

      if (result.length === 0) return null

      return this.mapRowToAnalysis(result[0])
    } catch (error) {
      console.error("Failed to get APK analysis:", error)
      throw error
    }
  },

  async getAllApkAnalyses(): Promise<ApkAnalysis[]> {
    try {
      const result = await sql`SELECT * FROM apk_analyses ORDER BY upload_time DESC`

      return result.map((row) => this.mapRowToAnalysis(row))
    } catch (error) {
      console.error("Failed to get all APK analyses:", error)
      throw error
    }
  },

  async deleteApkAnalysis(id: number): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM apk_analyses WHERE id = ${id}`
      return result.length > 0
    } catch (error) {
      console.error("Failed to delete APK analysis:", error)
      throw error
    }
  },

  async getAllSecurityCategories(): Promise<SecurityCategory[]> {
    try {
      const result = await sql`SELECT * FROM security_categories ORDER BY name`

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        enabled: row.enabled,
      }))
    } catch (error) {
      console.error("Failed to get security categories:", error)
      throw error
    }
  },

  mapRowToAnalysis(row: any): ApkAnalysis {
    return {
      id: row.id,
      fileName: row.file_name,
      fileSize: row.file_size,
      uploadTime: row.upload_time,
      analysisStatus: row.analysis_status,
      packageName: row.package_name,
      version: row.version,
      targetSdk: row.target_sdk,
      permissions: row.permissions,
      securityScore: row.security_score,
      criticalIssues: row.critical_issues,
      warningIssues: row.warning_issues,
      vulnerabilities: row.vulnerabilities,
      analysisResults: row.analysis_results,
      fixedApkPath: row.fixed_apk_path,
      reportPath: row.report_path,
    }
  },
}

// Initialize database on module load
storage.initializeDatabase().catch(console.error)
