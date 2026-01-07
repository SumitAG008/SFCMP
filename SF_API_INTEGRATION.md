# SuccessFactors Employee Compensation API v1 Integration

## API Reference
**Official API Documentation**: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation

## Integration Details

### Base Endpoint
```
/odata/v2/Employee_Compensation
```

### GET Operation

**Endpoint**: `GET /odata/v2/Employee_Compensation`

**Query Parameters**:
- `$filter`: Filter by companyId, userId, formId, employeeId
- `$select`: Select specific fields
- `$top`: Limit number of results
- `$skip`: Skip records

**Example**:
```
GET /odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'user@example.com'
```

**Response Format**:
```json
{
  "d": {
    "results": [
      {
        "id": "uuid",
        "companyId": "SFHUB003674",
        "userId": "user@example.com",
        "employeeId": "EMP001",
        "employeeName": "John Doe",
        "currentSalary": 100000,
        "meritIncrease": 3.0,
        "meritIncreaseAmount": 3000,
        "adjustmentIncrease": 2.0,
        "adjustmentIncreaseAmount": 2000,
        "lumpSum": 500,
        "finalSalary": 105000,
        "totalPayIncludingLumpSum": 105500,
        "currency": "USD",
        "effectiveDate": "2024-01-01",
        "status": "Draft"
      }
    ]
  }
}
```

### POST Operation

**Endpoint**: `POST /odata/v2/Employee_Compensation`

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "formId": "FORM-2024-001",
  "employeeId": "EMP001",
  "currentSalary": 100000,
  "meritIncrease": 3.0,
  "meritIncreaseAmount": 3000,
  "adjustmentIncrease": 2.0,
  "adjustmentIncreaseAmount": 2000,
  "lumpSum": 500,
  "finalSalary": 105000,
  "totalPayIncludingLumpSum": 105500,
  "currency": "USD",
  "effectiveDate": "2024-01-01",
  "status": "Draft"
}
```

**Response**: Created record with ID

### PATCH Operation (Update)

**Endpoint**: `PATCH /odata/v2/Employee_Compensation('{id}')`

**Request Body**: Partial update with only changed fields

## Field Mappings

| SuccessFactors API Field | BTP Extension Field | Description |
|-------------------------|---------------------|-------------|
| `employeeId` / `empId` | `employeeId` | Employee identifier |
| `employeeName` / `empName` | `employeeName` | Employee full name |
| `jobTitle` | `jobTitle` / `position` | Job title |
| `currentSalary` / `baseSalary` | `currentSalary` | Current base salary |
| `meritIncrease` / `meritPercent` | `meritIncrease` | Merit increase percentage |
| `meritIncreaseAmount` / `meritDollar` | `meritIncreaseAmount` | Merit increase amount |
| `adjustmentIncrease` / `adjustmentPercent` | `adjustmentIncrease` | Adjustment percentage |
| `adjustmentIncreaseAmount` / `adjustmentDollar` | `adjustmentIncreaseAmount` | Adjustment amount |
| `lumpSum` / `lumpSumAmount` | `lumpSumAmount` | Lump sum payment |
| `totalRaise` | `totalRaise` | Total raise amount |
| `totalIncrease` / `totalIncreasePercent` | `totalIncrease` | Total increase percentage |
| `totalIncreaseAmount` | `totalIncreaseAmount` | Total increase amount |
| `finalSalary` / `newSalary` | `finalSalary` | Final salary after increases |
| `finalSalaryRate` | `finalSalaryRate` | Monthly salary rate |
| `totalPayIncludingLumpSum` | `totalPayIncludingLumpSum` | Total pay including lump sum |
| `currency` / `currencyCode` | `currencyCode` | Currency code |
| `effectiveDate` | `effectiveDate` | Effective date |
| `status` / `compensationStatus` | `compensationStatus` | Status (Draft, Pending, Approved, Completed) |

## Implementation Status

✅ **GET Operation**: Implemented
- Fetches data from SuccessFactors Employee Compensation API v1
- Maps all fields correctly
- Supports filtering by companyId, userId, formId

✅ **POST Operation**: Implemented
- Creates new compensation records
- Maps all fields to SuccessFactors format
- Returns created record with ID

✅ **PATCH Operation**: Implemented
- Updates existing records
- Supports partial updates
- Maintains data integrity

✅ **UI Matching SuccessFactors**: Implemented
- Employee information section
- Current salary with currency
- Merit with $ and % columns
- Adjustment with $ and % columns
- Lump Sum column
- Total Raise, Total Increase
- Final Salary, Final Salary Rate
- Total Pay (Including Lump Sum)
- Status dropdown

## Next Steps

1. **Test GET API**: Verify data retrieval from SuccessFactors
2. **Test POST API**: Verify data creation in SuccessFactors
3. **Test Calculations**: Verify all calculations match SuccessFactors logic
4. **Add Budget Section**: Implement budget display
5. **Add Approval Workflow**: Implement approval status display
