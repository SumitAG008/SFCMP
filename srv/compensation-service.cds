using { Compensation } from '../db/schema';

service CompensationService {
  entity CompensationWorksheet as projection on Compensation;
  
  // Custom functions for SuccessFactors integration
  function getCompensationData(companyId: String, userId: String) returns array of CompensationWorksheet;
  action updateCompensationData(companyId: String, userId: String, data: array of CompensationWorksheet);
  action upsertCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
  action postCompensationData(companyId: String, userId: String, data: CompensationWorksheet) returns CompensationWorksheet;
}
