# SuccessFactors → BTP Extension API Documentation

## Overview

This BTP Extension provides REST/OData APIs that SuccessFactors can call to flow compensation data. The extension acts as a bridge between SuccessFactors and your custom compensation worksheet.

**Data Flow**: `SuccessFactors → BTP Extension APIs → Compensation Worksheet`

---

## API Endpoints

All APIs are available at: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/`

### Base URL
```
/compensation/CompensationService/
```

---

## 1. GET - Retrieve Compensation Data

### OData GET (Standard)
```
GET /compensation/CompensationService/CompensationWorksheet?$filter=companyId eq 'SFHUB003674' and userId eq 'user@example.com'
```

### Custom Function (Recommended for SuccessFactors)
```
POST /compensation/CompensationService/getCompensationData
```

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com"
}
```

**Response**:
```json
[
  {
    "id": "uuid-here",
    "companyId": "SFHUB003674",
    "userId": "user@example.com",
    "formId": "FORM-2024-001",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "position": "Senior Developer",
    "department": "IT",
    "currentSalary": 100000,
    "proposedSalary": 105000,
    "meritIncrease": 3.0,
    "promotionIncrease": 2.0,
    "adjustmentIncrease": 0.0,
    "totalIncrease": 5.0,
    "newSalary": 105000,
    "currency": "USD",
    "effectiveDate": "2024-01-01",
    "status": "Draft",
    "comments": "Annual review",
    "lastModified": "2024-01-15T10:30:00Z",
    "lastModifiedBy": "user@example.com"
  }
]
```

---

## 2. POST - Create New Compensation Record

### OData POST (Standard)
```
POST /compensation/CompensationService/CompensationWorksheet
```

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "formId": "FORM-2024-001",
  "employeeId": "EMP002",
  "employeeName": "Jane Smith",
  "position": "Manager",
  "department": "HR",
  "currentSalary": 120000,
  "proposedSalary": 126000,
  "meritIncrease": 4.0,
  "promotionIncrease": 1.0,
  "adjustmentIncrease": 0.0,
  "totalIncrease": 5.0,
  "newSalary": 126000,
  "currency": "USD",
  "effectiveDate": "2024-01-01",
  "status": "Draft",
  "comments": "New compensation record"
}
```

**Response**:
```json
{
  "id": "new-uuid-here",
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "formId": "FORM-2024-001",
  "employeeId": "EMP002",
  "employeeName": "Jane Smith",
  "position": "Manager",
  "department": "HR",
  "currentSalary": 120000,
  "proposedSalary": 126000,
  "meritIncrease": 4.0,
  "promotionIncrease": 1.0,
  "adjustmentIncrease": 0.0,
  "totalIncrease": 5.0,
  "newSalary": 126000,
  "currency": "USD",
  "effectiveDate": "2024-01-01",
  "status": "Draft",
  "comments": "New compensation record",
  "lastModified": "2024-01-15T10:30:00Z",
  "lastModifiedBy": "user@example.com"
}
```

### Custom Action (Alternative)
```
POST /compensation/CompensationService/postCompensationData
```

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": {
    "employeeId": "EMP002",
    "proposedSalary": 126000,
    "meritIncrease": 4.0,
    "status": "Draft"
  }
}
```

---

## 3. UPDATE - Update Existing Compensation Record

### OData PATCH (Standard)
```
PATCH /compensation/CompensationService/CompensationWorksheet('uuid-here')
```

**Request Body**:
```json
{
  "proposedSalary": 110000,
  "meritIncrease": 5.0,
  "status": "Pending",
  "comments": "Updated after review"
}
```

**Response**: Updated record

### Custom Action (Recommended for SuccessFactors)
```
POST /compensation/CompensationService/updateCompensationData
```

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": [
    {
      "id": "uuid-here",
      "employeeId": "EMP001",
      "proposedSalary": 110000,
      "meritIncrease": 5.0,
      "status": "Pending",
      "comments": "Updated after review"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "updated": 1,
  "results": [...]
}
```

---

## 4. UPSERT - Insert or Update (Update if exists, Insert if not)

### Custom Action
```
POST /compensation/CompensationService/upsertCompensationData
```

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": {
    "employeeId": "EMP001",
    "formId": "FORM-2024-001",
    "proposedSalary": 110000,
    "meritIncrease": 5.0,
    "status": "Pending"
  }
}
```

**How it works**:
1. Searches for existing record by `employeeId` + `formId` + `companyId`
2. If found: **UPDATES** the record
3. If not found: **CREATES** a new record

**Response**: The created or updated record

---

## 5. DELETE - Delete Compensation Record

### OData DELETE (Standard)
```
DELETE /compensation/CompensationService/CompensationWorksheet('uuid-here')
```

**Response**: 204 No Content (on success)

---

## SuccessFactors Integration

### How SuccessFactors Calls These APIs

SuccessFactors can call these APIs in several ways:

#### 1. **Via Integration Center / OData Integration**
- Configure OData destination pointing to your BTP Extension
- Use standard OData operations (GET, POST, PATCH, DELETE)

#### 2. **Via Workflow / Business Rules**
- Use HTTP/HTTPS calls in workflows
- Call custom actions: `postCompensationData`, `updateCompensationData`, `upsertCompensationData`

#### 3. **Via API Integration**
- Use SuccessFactors API to trigger BTP Extension APIs
- Example: After compensation form submission, call BTP Extension POST API

### Example: SuccessFactors → BTP Extension Flow

```
1. User submits compensation form in SuccessFactors
2. SuccessFactors workflow triggers
3. Workflow calls: POST /compensation/CompensationService/postCompensationData
4. BTP Extension receives data
5. BTP Extension processes and stores data
6. BTP Extension can also sync back to SuccessFactors (if needed)
```

---

## Authentication

All APIs require authentication. Use one of:

1. **OAuth 2.0** (Recommended):
   ```
   Authorization: Bearer <access_token>
   ```

2. **Basic Auth**:
   ```
   Authorization: Basic <base64_credentials>
   ```

3. **XSUAA Token** (BTP):
   ```
   Authorization: Bearer <xsuaa_token>
   ```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "500",
    "message": "Failed to process request",
    "details": "Specific error details here"
  }
}
```

### Common Error Codes
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (authentication failed)
- `404`: Not Found (record doesn't exist)
- `500`: Internal Server Error (processing failed)

---

## Testing APIs

### Using cURL

**GET**:
```bash
curl -X POST https://your-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId":"SFHUB003674","userId":"user@example.com"}'
```

**POST**:
```bash
curl -X POST https://your-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId":"SFHUB003674","userId":"user@example.com","data":{"employeeId":"EMP001","proposedSalary":105000}}'
```

**UPSERT**:
```bash
curl -X POST https://your-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/upsertCompensationData \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId":"SFHUB003674","userId":"user@example.com","data":{"employeeId":"EMP001","formId":"FORM-001","proposedSalary":110000}}'
```

---

## Data Flow Diagram

```
┌─────────────────┐
│ SuccessFactors  │
│  Compensation   │
└────────┬────────┘
         │
         │ HTTP/HTTPS API Calls
         │ (GET/POST/PATCH/UPSERT)
         ▼
┌─────────────────┐
│  BTP Extension  │
│  Compensation   │
│     Service     │
└────────┬────────┘
         │
         │ Process & Store
         ▼
┌─────────────────┐
│  Compensation   │
│    Worksheet    │
│   (UI5 App)     │
└─────────────────┘
```

---

## Best Practices

1. **Use UPSERT** for idempotent operations (safe to retry)
2. **Use POST** when creating new records
3. **Use PATCH** for partial updates
4. **Handle errors gracefully** - APIs return proper error codes
5. **Use batch operations** when updating multiple records
6. **Implement retry logic** in SuccessFactors workflows

---

## Next Steps

1. Deploy your BTP Extension
2. Get the API endpoint URL
3. Configure SuccessFactors to call these APIs
4. Test the integration
5. Monitor API calls and responses
