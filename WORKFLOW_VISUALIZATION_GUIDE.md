# Workflow Visualization - Complete Guide

## 🎯 Overview

A new **Workflow Visualization** page has been created that shows the compensation approval workflow in a visual, vertical process flow format with employee photos and status tracking.

## Features

✅ **Vertical Process Flow** - Steps displayed as A → B → C → D → E → F
✅ **Employee Photos** - Avatar/photos for each workflow assignee
✅ **Status Tracking** - Visual indicators for Completed, In Progress, Pending
✅ **Step Details** - Shows who is handling each step, comments, dates
✅ **Visual Connectors** - Arrow icons connecting workflow steps
✅ **Color Coding** - Different colors for different statuses

## Workflow Steps

The workflow consists of 6 steps:

1. **Initiated** ✅ (Green) - Form created
2. **Manager Review** ⏳ (Yellow) - Direct manager approval
3. **HR Review** ⏸️ (Gray) - HR compliance check
4. **Finance Approval** ⏸️ (Gray) - Budget approval
5. **Final Approval** ⏸️ (Gray) - Executive approval
6. **Completed** ✅ (Green) - Process finished

## How to Access

### Method 1: From Compensation Worksheet

1. Open Compensation Worksheet
2. Click **"Approvals"** button (approval icon) in header
3. Workflow page opens automatically

### Method 2: Direct URL

```
http://localhost:4004/app/workflow.html?companyId=SFHUB003674&formId=EmpComp
```

### Method 3: From SuccessFactors

When integrated with SuccessFactors, add workflow tile:
```
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/workflow.html?companyId=SFHUB003674&formId={formId}
```

## Visual Design

### Vertical Flow Layout

```
┌─────────────────────────┐
│  Step 1: Initiated      │ ✅ Completed
│  👤 System User         │
│  📅 Jan 7, 2026         │
└───────────┬─────────────┘
            │ ↓
┌───────────▼─────────────┐
│  Step 2: Manager Review │ ⏳ In Progress
│  👤 John Manager        │
│  📅 Due: Jan 14, 2026   │
└───────────┬─────────────┘
            │ ↓
┌───────────▼─────────────┐
│  Step 3: HR Review      │ ⏸️ Pending
│  👤 Sarah HR            │
└───────────┬─────────────┘
            │ ↓
┌───────────▼─────────────┐
│  Step 4: Finance        │ ⏸️ Pending
│  👤 Mike Finance        │
└───────────┬─────────────┘
            │ ↓
┌───────────▼─────────────┐
│  Step 5: Final Approval │ ⏸️ Pending
│  👤 Lisa Executive      │
└───────────┬─────────────┘
            │ ↓
┌───────────▼─────────────┐
│  Step 6: Completed      │ ✅ Done
└─────────────────────────┘
```

## Status Colors

- **Green** ✅ - Completed steps
- **Blue** ⏳ - In Progress (current step)
- **Gray** ⏸️ - Pending (not started)
- **Red** ❌ - Rejected (if applicable)

## Employee Photos

Each workflow step shows:
- **Avatar/Photo** - Employee picture or icon
- **Name** - Assignee name
- **Role** - Job title/role
- **Status Badge** - Current status

## API Integration

### GET Workflow Status

**Endpoint**: `POST /compensation/CompensationService/getWorkflowStatus`

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "formId": "EmpComp"
}
```

**Response**:
```json
{
  "companyId": "SFHUB003674",
  "formId": "EmpComp",
  "overallStatus": "In Progress",
  "currentStep": "Step 2: Manager Review",
  "initiatedBy": "sfadmin",
  "initiatedDate": "1/7/2026",
  "steps": [
    {
      "stepNumber": 1,
      "stepName": "Initiated",
      "status": "Completed",
      "statusState": "Success",
      "assigneeName": "System User",
      "assigneeRole": "Initiator",
      "assigneePhoto": "sap-icon://employee",
      "completedDate": "1/7/2026",
      "comments": "Form created"
    },
    {
      "stepNumber": 2,
      "stepName": "Manager Review",
      "status": "In Progress",
      "statusState": "Warning",
      "assigneeName": "John Manager",
      "assigneeRole": "Direct Manager",
      "assigneePhoto": "sap-icon://manager",
      "completedDate": "",
      "comments": ""
    }
    // ... more steps
  ],
  "employees": [
    {
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "photo": "sap-icon://employee",
      "finalSalary": 103000,
      "status": "Pending"
    }
  ]
}
```

## Integration with SuccessFactors Workflow

### Current Implementation

Currently uses **mock data** for demonstration. To integrate with real SuccessFactors workflow:

1. **SuccessFactors Workflow API**:
   - Call SuccessFactors Workflow API to get real workflow status
   - Map SuccessFactors workflow steps to visualization steps

2. **Employee Photos**:
   - Fetch employee photos from SuccessFactors Employee Central
   - Use photo URL or base64 encoded image

3. **Real-time Updates**:
   - Poll SuccessFactors for workflow status changes
   - Update visualization automatically

### TODO: Real Integration

Update `srv/compensation-service.js` `getWorkflowStatus` function:

```javascript
this.on('getWorkflowStatus', async (req) => {
    const { companyId, formId } = req.data;
    
    // Call SuccessFactors Workflow API
    const endpoint = `/odata/v2/WorkflowInstance?$filter=formId eq '${formId}' and companyId eq '${companyId}'`;
    const workflowData = await callSFAPI(endpoint);
    
    // Transform SuccessFactors workflow to visualization format
    // Map workflow steps, assignees, status, etc.
    
    return transformedWorkflow;
});
```

## Files Created

1. **`app/webapp/view/WorkflowVisualization.view.xml`** - Workflow UI
2. **`app/webapp/controller/WorkflowVisualization.controller.js`** - Workflow logic
3. **`app/webapp/workflow.html`** - Workflow page entry point
4. **`app/webapp/css/custom.css`** - Workflow styles (updated)

## Usage

### From Compensation Worksheet

1. Fill in Company ID, User ID, Form ID
2. Click **"Approvals"** button (top right)
3. Workflow visualization opens

### Direct Access

Navigate to:
```
http://localhost:4004/app/workflow.html?companyId=SFHUB003674&formId=EmpComp&userId=sfadmin
```

## Features in Detail

### 1. Visual Process Flow
- Steps displayed vertically
- Arrow connectors between steps
- Color-coded by status

### 2. Employee Information
- Avatar/photos for each assignee
- Name and role displayed
- Status badge

### 3. Step Details
- Step name and description
- Assignee information
- Completion date
- Comments/notes

### 4. Overall Status
- Workflow summary at top
- Current step highlighted
- Overall progress indicator

## Next Steps

1. ✅ **UI Created** - Workflow visualization page
2. ⏳ **Integrate SuccessFactors Workflow API** - Get real workflow data
3. ⏳ **Employee Photos** - Fetch from SuccessFactors Employee Central
4. ⏳ **Real-time Updates** - Poll for status changes
5. ⏳ **Notifications** - Alert when workflow progresses

## Summary

**Workflow Visualization is now available!** 🎉

- Click "Approvals" button from Compensation Worksheet
- See vertical process flow: A → B → C → D → E → F
- View employee photos and assignees
- Track workflow status visually
- See who is handling each step

**Pull the latest changes and test it!**
