using { com.sap.sf.compensation as comp } from '../db/schema';

service CompensationService {
  entity CompensationWorksheet as projection on comp.Compensation;
  
  // Custom functions for SuccessFactors integration
  function getCompensationData(companyId: String, userId: String) returns array of CompensationWorksheet;
  action updateCompensationData(companyId: String, userId: String, data: array of CompensationWorksheet);
  action upsertCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
  action postCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
  function getWorkflowStatus(companyId: String, formId: String) returns WorkflowStatus;
  function checkUserRBP(companyId: String, userId: String, permission: String) returns RBPStatus;
  function getEmployeeDataByRBP(companyId: String, userId: String) returns array of EmployeeData;
}
