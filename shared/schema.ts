import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

export const apkAnalyses = pgTable("apk_analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadTime: timestamp("upload_time").defaultNow(),
  analysisStatus: text("analysis_status").notNull().default("pending"), // pending, analyzing, completed, failed
  packageName: text("package_name"),
  version: text("version"),
  targetSdk: integer("target_sdk"),
  permissions: jsonb("permissions").$type<string[]>(),
  securityScore: integer("security_score"),
  criticalIssues: integer("critical_issues").default(0),
  warningIssues: integer("warning_issues").default(0),
  vulnerabilities: jsonb("vulnerabilities").$type<Vulnerability[]>(),
  analysisResults: jsonb("analysis_results").$type<AnalysisResult>(),
  fixedApkPath: text("fixed_apk_path"),
  reportPath: text("report_path"),
})

export const securityCategories = pgTable("security_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  enabled: boolean("enabled").default(true),
})

export type Vulnerability = {
  id: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  category: string
  location: string
  cvssScore?: number
  recommendation?: string
}

export type AnalysisResult = {
  reconnaissance: SecurityCheck
  subdomainEnumeration: SecurityCheck
  portScanning: SecurityCheck
  directoryEnumeration: SecurityCheck
  vulnerabilityScanning: SecurityCheck
  manualTesting: SecurityCheck
  authenticationTesting: SecurityCheck
  sessionManagement: SecurityCheck
  inputValidation: SecurityCheck
  sqlInjection: SecurityCheck
  xss: SecurityCheck
  csrf: SecurityCheck
  ssrf: SecurityCheck
  idor: SecurityCheck
  rce: SecurityCheck
  fileInclusion: SecurityCheck
  clickjacking: SecurityCheck
  rateLimiting: SecurityCheck
  accessControl: SecurityCheck
  businessLogic: SecurityCheck
  apiTesting: SecurityCheck
  mobileAppTesting: SecurityCheck
  clientSideVulns: SecurityCheck
  informationDisclosure: SecurityCheck
  serverSideVulns: SecurityCheck
}

export type SecurityCheck = {
  status: "passed" | "warning" | "critical" | "secure" | "failed"
  issueCount: number
  details: string
  findings: string[]
  vulnerabilities: Vulnerability[]
  recommendations: string[]
  codeSnippets: string[]
}

export const insertApkAnalysisSchema = createInsertSchema(apkAnalyses)
  .omit({
    id: true,
    uploadTime: true,
  })
  .extend({
    fixedApkPath: z.string().nullable().optional(),
    reportPath: z.string().nullable().optional(),
  })

export const insertSecurityCategorySchema = createInsertSchema(securityCategories).omit({
  id: true,
})

export type InsertApkAnalysis = z.infer<typeof insertApkAnalysisSchema>
export type ApkAnalysis = typeof apkAnalyses.$inferSelect
export type InsertSecurityCategory = z.infer<typeof insertSecurityCategorySchema>
export type SecurityCategory = typeof securityCategories.$inferSelect
