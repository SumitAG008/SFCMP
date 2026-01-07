namespace com.sap.sf.compensation;

entity Compensation {
  key id: UUID;
  companyId: String(20);
  userId: String(100);
  formId: String(100);
  employeeId: String(100);
  employeeName: String(200);
  position: String(200);
  department: String(200);
  currentSalary: Decimal(15, 2);
  proposedSalary: Decimal(15, 2);
  meritIncrease: Decimal(5, 2);
  promotionIncrease: Decimal(5, 2);
  adjustmentIncrease: Decimal(5, 2);
  totalIncrease: Decimal(5, 2);
  newSalary: Decimal(15, 2);
  currency: String(3);
  effectiveDate: Date;
  status: String(50);
  comments: String(5000);
  lastModified: DateTime;
  lastModifiedBy: String(100);
}
