# RBP Integration - Quick Start

## ✅ What's Implemented

### 1. RBP Permission Checks
- ✅ **COMPENSATION_VIEW** - Required to view data
- ✅ **COMPENSATION_EDIT** - Required to edit/save data
- ✅ Checks happen automatically on GET and UPDATE operations

### 2. Employee Data from SuccessFactors
- ✅ Employee data fetched from SuccessFactors
- ✅ Filtered based on RBP (managers see direct reports, admins see all)
- ✅ Employee photos included

### 3. Access Control
- ✅ Only users with RBP can access app
- ✅ Permission checked before every operation
- ✅ Clear error messages if access denied

## How It Works

### Step 1: User Opens App

```
User: sfadmin (with COMPENSATION_MANAGER role)
URL: ?companyId=SFHUB003674&userId=sfadmin
```

### Step 2: RBP Check (Automatic)

**When user clicks Refresh**:
1. UI calls `checkUserRBP(userId, companyId, 'COMPENSATION_VIEW')`
2. BTP calls SuccessFactors RBP API
3. SuccessFactors returns: `{ hasPermission: true, role: 'COMPENSATION_MANAGER' }`
4. Access granted ✅

### Step 3: Get Employee Data

**Based on RBP**:
- **Manager**: Gets direct reports only
- **HR Admin**: Gets all employees
- **Employee**: Gets own data only

### Step 4: Load Compensation Data

**Only employees user has access to**:
- Data filtered by RBP
- Employee photos from SuccessFactors
- Compensation data displayed

### Step 5: Save (RBP Check Again)

**When user clicks Save**:
1. UI calls `checkUserRBP(userId, companyId, 'COMPENSATION_EDIT')`
2. If permission granted → Save to SuccessFactors
3. If denied → Show error message

## RBP Roles in SuccessFactors

### Required Roles

1. **COMPENSATION_USER**
   - Can view compensation data
   - Cannot edit

2. **COMPENSATION_MANAGER**
   - Can view compensation data
   - Can edit direct reports
   - Can see team members only

3. **COMPENSATION_ADMIN**
   - Can view all compensation data
   - Can edit all employees
   - Full access

4. **HR_MANAGER / HR_ADMIN**
   - Can view all compensation data
   - Can edit all employees
   - Full access

## Configuration in SuccessFactors

### Step 1: Assign RBP Roles

1. **Go to SuccessFactors Admin Center**
2. **Manage Permission Roles**
3. **Assign roles to users**:
   - Managers → `COMPENSATION_MANAGER`
   - HR Admins → `COMPENSATION_ADMIN`
   - Employees → `COMPENSATION_USER` (or no role)

### Step 2: Configure Data Permissions

1. **Admin Center** → **Manage Data Permission**
2. **Set RBP rules**:
   - Managers: Direct reports only
   - Admins: All employees
   - Employees: Own data only

## API Endpoints

### Check RBP
```
POST /compensation/CompensationService/checkUserRBP
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "permission": "COMPENSATION_VIEW"
}
```

### Get Employee Data (Filtered by RBP)
```
POST /compensation/CompensationService/getEmployeeDataByRBP
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin"
}
```

## What Happens Now

### ✅ Automatic RBP Checks

1. **On Page Load** (if userId in URL):
   - Checks COMPENSATION_VIEW permission
   - Gets employee data based on RBP
   - Loads compensation data

2. **On Refresh**:
   - Checks COMPENSATION_VIEW permission
   - Gets employee data
   - Loads compensation data

3. **On Save**:
   - Checks COMPENSATION_EDIT permission
   - If granted → Saves to SuccessFactors
   - If denied → Shows error

### ✅ Employee Data from SuccessFactors

- Employee photos from SuccessFactors Employee Central
- Employee names, roles, departments
- Filtered based on RBP permissions

## Testing

### Test 1: User with Permission

```bash
# User: manager001 (has COMPENSATION_MANAGER role)
# Opens app → RBP check passes → Data loads
```

### Test 2: User without Permission

```bash
# User: emp001 (no compensation role)
# Opens app → RBP check fails → Access Denied message
```

## Summary

✅ **RBP Integration Complete!**

- ✅ Permission checks on all operations
- ✅ Employee data from SuccessFactors
- ✅ Data filtered by RBP
- ✅ Access controlled from SuccessFactors
- ✅ Only users with RBP can access

**The app is now fully secured with SuccessFactors RBP!** 🔒
