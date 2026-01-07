using { com.sap.sf.compensation as comp } from '../db/schema';

service CompensationService {
  entity CompensationWorksheet as projection on comp.Compensation;
  
  // Custom functions for SuccessFactors integration
  function getCompensationData(companyId: String, userId: String) returns array of CompensationWorksheet;
  action updateCompensationData(companyId: String, userId: String, data: array of CompensationWorksheet);
  action upsertCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
  action postCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
  
  // Workflow Status Structure
  type WorkflowStatus {
    companyId: String(20);
    formId: String(100);
    overallStatus: String(50);
    currentStep: String(100);
    initiatedBy: String(100);
    initiatedDate: String(50);
    steps: array of WorkflowStep;
    employees: array of WorkflowEmployee;
  }
  
  type WorkflowStep {
    stepNumber: Integer;
    stepName: String(100);
    status: String(50);
    statusState: String(50);
    assigneeName: String(200);
    assigneeRole: String(100);
    assigneePhoto: String(500);
    assigneeId: String(100);
    completedDate: String(50);
    comments: String(5000);
    dueDate: String(50);
  }
  
  type WorkflowEmployee {
    employeeId: String(100);
    employeeName: String(200);
    photo: String(500);
    finalSalary: Decimal(15, 2);
    status: String(50);
  }
  
  // RBP (Role-Based Permissions) Types
  type RBPStatus {
    hasPermission: Boolean;
    userId: String(100);
    companyId: String(20);
    permission: String(100);
    role: String(200);
    permissionType: String(100);
    message: String(500);
  }
  
  type EmployeeData {
    employeeId: String(100);
    employeeName: String(200);
    firstName: String(100);
    lastName: String(100);
    email: String(200);
    photo: String(500);
    department: String(200);
    jobTitle: String(200);
    position: String(200);
    managerId: String(100);
    managerName: String(200);
  }
  
  type WorkflowConfig {
    workflowName: String(200);
    formId: String(100);
    description: String(500);
    steps: array of WorkflowStep;
  }
  
  function getWorkflowStatus(companyId: String, formId: String) returns WorkflowStatus;
  action checkUserRBP(companyId: String, userId: String, permission: String) returns RBPStatus;
  action getEmployeeDataByRBP(companyId: String, userId: String) returns array of EmployeeData;
  action saveWorkflow(companyId: String, formId: String, workflow: WorkflowConfig) returns WorkflowConfig;
  
  // Employee Data Extraction
  function getEmployeeDataFromSF(companyId: String, userId: String, employeeId: String) returns EmployeeData;
  
  // MDF Object Integration
  action saveToMDFObject(companyId: String, data: CompensationWorksheet) returns String;
  function getFromMDFObject(companyId: String, employeeId: String, formId: String) returns CompensationWorksheet;
  
  // Audit and Reporting Types
  type AuditLog {
    id: UUID;
    companyId: String(20);
    userId: String(100);
    action: String(50);
    entityType: String(50);
    entityId: String(100);
    oldValue: String(5000);
    newValue: String(5000);
    timestamp: DateTime;
    ipAddress: String(50);
    userAgent: String(500);
    sessionId: String(100);
    changes: String(5000);
  }
  
  type CompensationReport {
    id: UUID;
    reportName: String(200);
    reportType: String(50);
    companyId: String(20);
    formId: String(100);
    generatedBy: String(100);
    generatedAt: DateTime;
    reportData: LargeString;
    status: String(50);
    exportFormat: String(50);
  }
  
  // Audit and Reporting Functions
  function getAuditLogs(companyId: String, userId: String, entityType: String, startDate: DateTime, endDate: DateTime) returns array of AuditLog;
  action generateReport(companyId: String, formId: String, reportType: String, startDate: DateTime, endDate: DateTime) returns CompensationReport;
  action exportReport(reportId: UUID, format: String) returns String;
  
  // Entity projections for audit and reports
  entity AuditLogs as projection on comp.AuditLog;
  entity Reports as projection on comp.CompensationReport;
}
