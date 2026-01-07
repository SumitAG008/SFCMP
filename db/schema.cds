namespace com.sap.sf.compensation;

entity Compensation {
  key id: UUID;
  companyId: String(20);
  userId: String(100);
  formId: String(100);
  employeeId: String(100);
  employeeName: String(200);
  firstName: String(100);
  lastName: String(100);
  position: String(200);
  jobTitle: String(200);
  department: String(200);
  departmentName: String(200);
  currentSalary: Decimal(15, 2);
  baseSalary: Decimal(15, 2);
  proposedSalary: Decimal(15, 2);
  meritIncrease: Decimal(5, 2);
  meritIncreaseAmount: Decimal(15, 2);
  promotionIncrease: Decimal(5, 2);
  promotionIncreaseAmount: Decimal(15, 2);
  adjustmentIncrease: Decimal(5, 2);
  adjustmentIncreaseAmount: Decimal(15, 2);
  lumpSum: Decimal(15, 2);
  lumpSumAmount: Decimal(15, 2);
  totalIncrease: Decimal(5, 2);
  totalIncreaseAmount: Decimal(15, 2);
  totalRaise: Decimal(15, 2);
  newSalary: Decimal(15, 2);
  finalSalary: Decimal(15, 2);
  finalSalaryRate: Decimal(15, 2);
  totalPay: Decimal(15, 2);
  totalPayIncludingLumpSum: Decimal(15, 2);
  currency: String(3);
  currencyCode: String(3);
  effectiveDate: Date;
  status: String(50);
  compensationStatus: String(50);
  comments: String(5000);
  notes: String(5000);
  performanceRating: String(100);
  overallPerformanceRating: String(100);
  payGrade: String(50);
  salaryRangeMin: Decimal(15, 2);
  salaryRangeMax: Decimal(15, 2);
  compaRatio: Decimal(5, 2);
  rangePenetration: Decimal(5, 2);
  hireDate: Date;
  fte: Decimal(3, 2);
  lastModified: DateTime;
  lastModifiedBy: String(100);
  lastModifiedDate: DateTime;
}

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
}
