# SuccessFactors RBP (Role-Based Permissions) Integration

## Overview

This guide explains how SuccessFactors RBP (Role-Based Permissions) is integrated to control access to the Compensation Worksheet application.

## What is RBP?

**RBP (Role-Based Permissions)** in SuccessFactors:
- Controls who can access what data
- Defines user roles and permissions
- Ensures data security and compliance
- Manages employee data visibility

## Integration Architecture

```
┌─────────────────────────────────┐
│   User in SuccessFactors        │
│   (with RBP roles)              │
└──────────────┬──────────────────┘
               │
               │ 1. User clicks Compensation Worksheet
               │
┌──────────────▼──────────────────┐
│   BTP Extension                  │
│   RBP Check                      │
│   checkUserRBP()                 │
└──────────────┬──────────────────┘
               │
               │ 2. Calls SuccessFactors RBP API
               │
┌──────────────▼──────────────────┐
│   SuccessFactors RBP API         │
│   /odata/v2/UserPermissionNav   │
│   /odata/v2/User                 │
└──────────────┬──────────────────┘
               │
               │ 3. Returns permissions
               │
┌──────────────▼──────────────────┐
│   BTP Extension                  │
│   • Check permission             │
│   • Allow/Deny access            │
│   • Get employee data by RBP     │
└──────────────┬──────────────────┘
               │
               │ 4. If allowed, fetch data
               │
┌──────────────▼──────────────────┐
│   SuccessFactors Employee API    │
│   Returns only accessible        │
│   employees based on RBP          │
└─────────────────────────────────┘
```

## RBP Permissions Required

### 1. COMPENSATION_VIEW
- **Purpose**: View compensation data
- **Required for**: GET operations, viewing worksheet
- **Roles**: 
  - COMPENSATION_USER
  - COMPENSATION_MANAGER
  - COMPENSATION_ADMIN
  - HR_MANAGER
  - HR_ADMIN

### 2. COMPENSATION_EDIT
- **Purpose**: Edit/update compensation data
- **Required for**: UPDATE, POST, UPSERT operations
- **Roles**:
  - COMPENSATION_MANAGER
  - COMPENSATION_ADMIN
  - HR_ADMIN

## How RBP Works

### Step 1: User Access

**User opens Compensation Worksheet**:
```
URL: ?companyId=SFHUB003674&userId=sfadmin
```

**What Happens**:
1. BTP receives request with userId
2. Calls `checkUserRBP(userId, companyId, 'COMPENSATION_VIEW')`
3. SuccessFactors RBP API checks user permissions
4. Returns permission status

### Step 2: Permission Check

**Backend Code** (`srv/rbp-service.js`):
```javascript
async function checkUserRBP(userId, companyId, permission) {
    // Call SuccessFactors RBP API
    const endpoint = `/odata/v2/UserPermissionNav?$filter=userId eq '${userId}' and companyId eq '${companyId}' and permission eq '${permission}'`;
    const response = await axios.get(endpoint);
    
    if (response.data.d.results.length > 0) {
        return {
            hasPermission: true,
            role: response.data.d.results[0].role,
            permissionType: response.data.d.results[0].permissionType
        };
    }
    
    return { hasPermission: false };
}
```

### Step 3: Employee Data Filtering

**Based on RBP, user sees only**:
- **Direct Reports**: If user is a manager
- **Own Data**: If user is an employee
- **All Employees**: If user is HR Admin or Compensation Admin

**Backend Code**:
```javascript
async function getEmployeeDataByRBP(userId, companyId) {
    // Check permission first
    const rbpCheck = await checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
    if (!rbpCheck.hasPermission) {
        throw new Error('No permission');
    }

    // Get employees based on RBP
    // If manager: Get direct reports
    // If admin: Get all employees
    // If employee: Get own data only
    const endpoint = `/odata/v2/Employee?$filter=companyId eq '${companyId}' and (managerId eq '${userId}' or userId eq '${userId}')`;
    const response = await axios.get(endpoint);
    
    return response.data.d.results;
}
```

## API Endpoints

### 1. Check User RBP

**Endpoint**: `POST /compensation/CompensationService/checkUserRBP`

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "permission": "COMPENSATION_VIEW"
}
```

**Response**:
```json
{
  "hasPermission": true,
  "userId": "sfadmin",
  "companyId": "SFHUB003674",
  "permission": "COMPENSATION_VIEW",
  "role": "COMPENSATION_MANAGER",
  "permissionType": "COMPENSATION_ACCESS",
  "message": "User sfadmin has COMPENSATION_VIEW permission"
}
```

### 2. Get Employee Data by RBP

**Endpoint**: `POST /compensation/CompensationService/getEmployeeDataByRBP`

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin"
}
```

**Response**:
```json
[
  {
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "photo": "https://api.successfactors.eu/photo/EMP001",
    "department": "Sales",
    "jobTitle": "Sales Manager",
    "position": "Sales Manager",
    "managerId": "sfadmin",
    "managerName": "System Admin"
  }
]
```

## Access Control Flow

### Scenario 1: Manager Access

```
1. Manager (userId: manager001) opens app
   ↓
2. RBP Check: COMPENSATION_VIEW
   → SuccessFactors: User has COMPENSATION_MANAGER role
   → Permission: GRANTED
   ↓
3. Get Employee Data
   → SuccessFactors: Returns direct reports only
   → Employees: EMP001, EMP002, EMP003 (manager's team)
   ↓
4. Manager sees only his team's compensation
```

### Scenario 2: HR Admin Access

```
1. HR Admin (userId: hradmin) opens app
   ↓
2. RBP Check: COMPENSATION_VIEW
   → SuccessFactors: User has HR_ADMIN role
   → Permission: GRANTED
   ↓
3. Get Employee Data
   → SuccessFactors: Returns all employees (admin access)
   → Employees: All employees in company
   ↓
4. HR Admin sees all compensation data
```

### Scenario 3: Employee Access (Denied)

```
1. Employee (userId: emp001) opens app
   ↓
2. RBP Check: COMPENSATION_VIEW
   → SuccessFactors: User has no compensation role
   → Permission: DENIED
   ↓
3. Error Message:
   "Access Denied: User emp001 does not have COMPENSATION_VIEW permission"
   ↓
4. App shows access denied, no data loaded
```

## RBP Configuration in SuccessFactors

### Step 1: Configure RBP in SuccessFactors

1. **Go to Admin Center** → **Manage Permission Roles**
2. **Create/Edit Role**:
   - Role Name: `COMPENSATION_MANAGER`
   - Permissions:
     - `COMPENSATION_VIEW` ✅
     - `COMPENSATION_EDIT` ✅
     - `EMPLOYEE_DATA_VIEW` ✅

3. **Assign Role to Users**:
   - Go to **Manage Permission Roles**
   - Assign `COMPENSATION_MANAGER` to managers
   - Assign `COMPENSATION_ADMIN` to HR admins

### Step 2: Configure Employee Data Access

1. **Go to Admin Center** → **Manage Data Permission**
2. **Set RBP Rules**:
   - Managers can see: Direct reports only
   - HR Admins can see: All employees
   - Employees can see: Own data only

## Implementation Details

### Files Created/Modified

1. **`srv/rbp-service.js`** - RBP service module
   - `checkUserRBP()` - Check user permissions
   - `checkUserRoles()` - Check user roles (fallback)
   - `getEmployeeDataByRBP()` - Get employees based on RBP
   - `canUserEditCompensation()` - Check edit permission

2. **`srv/compensation-service.js`** - Updated
   - Added RBP checks in GET, UPDATE, POST, UPSERT
   - Calls RBP service before data operations

3. **`app/webapp/controller/CompensationWorksheet.controller.js`** - Updated
   - Checks RBP before loading data
   - Shows access denied message if no permission
   - Gets employee data based on RBP

4. **`srv/compensation-service.cds`** - Updated
   - Added `checkUserRBP` function
   - Added `getEmployeeDataByRBP` function

5. **`db/schema.cds`** - Updated
   - Added `RBPStatus` type
   - Added `EmployeeData` type

## Security Features

### 1. Permission Check on Every Operation
- ✅ GET - Checks COMPENSATION_VIEW
- ✅ UPDATE - Checks COMPENSATION_EDIT
- ✅ POST - Checks COMPENSATION_EDIT
- ✅ UPSERT - Checks COMPENSATION_EDIT

### 2. Employee Data Filtering
- Only shows employees user has access to
- Based on manager hierarchy
- Based on admin roles

### 3. Error Handling
- 403 Forbidden if no permission
- Clear error messages
- Logs permission checks

## Testing RBP

### Test 1: User with Permission

```bash
# User with COMPENSATION_MANAGER role
POST /compensation/CompensationService/checkUserRBP
{
  "companyId": "SFHUB003674",
  "userId": "manager001",
  "permission": "COMPENSATION_VIEW"
}

# Expected: { "hasPermission": true }
```

### Test 2: User without Permission

```bash
# Regular employee
POST /compensation/CompensationService/checkUserRBP
{
  "companyId": "SFHUB003674",
  "userId": "emp001",
  "permission": "COMPENSATION_VIEW"
}

# Expected: { "hasPermission": false }
```

### Test 3: Get Employee Data

```bash
POST /compensation/CompensationService/getEmployeeDataByRBP
{
  "companyId": "SFHUB003674",
  "userId": "manager001"
}

# Expected: Array of direct reports only
```

## SuccessFactors RBP API Endpoints

### 1. User Permission Navigation
```
GET /odata/v2/UserPermissionNav?$filter=userId eq 'userId' and permission eq 'permission'
```

### 2. User Roles
```
GET /odata/v2/User?$filter=userId eq 'userId'&$select=userId,role,permission
```

### 3. Employee Data (Filtered by RBP)
```
GET /odata/v2/Employee?$filter=companyId eq 'companyId' and (managerId eq 'userId' or userId eq 'userId')
```

## Configuration

### Environment Variables

```bash
# SuccessFactors API
SF_URL=https://api.successfactors.eu
SF_USERNAME=your_username
SF_PASSWORD=your_password
SF_COMPANY_ID=SFHUB003674

# OAuth (if using)
SF_CLIENT_ID=your_client_id
SF_CLIENT_SECRET=your_client_secret
```

### SuccessFactors Admin Center

1. **Permission Roles**:
   - COMPENSATION_USER
   - COMPENSATION_MANAGER
   - COMPENSATION_ADMIN

2. **Data Permissions**:
   - Manager → Direct Reports
   - Admin → All Employees
   - Employee → Own Data

## Summary

✅ **RBP Integration Complete!**

- ✅ Permission checks on all operations
- ✅ Employee data filtered by RBP
- ✅ Access control from SuccessFactors
- ✅ Only users with RBP can access app
- ✅ Employee data comes from SuccessFactors

**Users must have RBP permissions in SuccessFactors to access the Compensation Worksheet!** 🔒
