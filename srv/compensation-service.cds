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
  
  function getWorkflowStatus(companyId: String, formId: String) returns WorkflowStatus;
  function checkUserRBP(companyId: String, userId: String, permission: String) returns RBPStatus;
  function getEmployeeDataByRBP(companyId: String, userId: String) returns array of EmployeeData;
  action saveWorkflow(companyId: String, formId: String, workflow: WorkflowConfig) returns WorkflowConfig;
}
