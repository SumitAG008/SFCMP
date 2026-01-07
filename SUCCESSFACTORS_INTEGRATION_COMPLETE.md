# SuccessFactors Integration - Complete Guide

## 🎉 Great News - UI is Working!

Your Compensation Worksheet is now visible and functional. Now let's integrate it with SuccessFactors.

## Integration Architecture

```
┌─────────────────────────────────┐
│   SuccessFactors                │
│   Compensation Module           │
│                                 │
│   • Compensation Forms          │
│   • Employee Data               │
│   • Compensation Plans          │
└──────────────┬──────────────────┘
               │
               │ Option 1: Embed UI (iframe)
               │ Option 2: Deep Link (redirect)
               │ Option 3: API Integration
               │
┌──────────────▼──────────────────┐
│   SAP BTP Extension             │
│   Your Compensation Worksheet   │
│                                 │
│   • UI5 Application             │
│   • REST/OData APIs             │
│   • SuccessFactors API Calls    │
└─────────────────────────────────┘
```

## Method 1: Embed UI in SuccessFactors (Recommended)

### Step 1: Deploy BTP Extension

```bash
# Build MTA
mbt build

# Deploy to BTP
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### Step 2: Get Your BTP Application URL

After deployment, get your app URL:
```bash
cf apps
# Note the URL, e.g.:
# https://compensation-app-<space>.cfapps.us10-001.hana.ondemand.com
```

### Step 3: Configure SuccessFactors to Embed UI

#### Option A: Using SuccessFactors Admin Center

1. **Go to Admin Center** → **Integration Center**
2. **Create OData Destination**:
   - Name: `BTP_Compensation_Extension`
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html`
   - Type: `HTTP`
   - Authentication: Configure as needed

3. **Create Custom Tile**:
   - Go to **Admin Center** → **Manage Integration Tiles**
   - Click **Create New Tile**
   - Configure:
     - **Title**: "Compensation Worksheet"
     - **URL**: Your BTP app URL
     - **Type**: "External Link" or "Embedded Content"
     - **Icon**: Choose appropriate icon
     - **Target**: "New Window" or "Same Window"

4. **Add to Home Page**:
   - Go to **Home Page Configuration**
   - Add the custom tile to user's home page
   - Users will see "Compensation Worksheet" tile

#### Option B: Using SuccessFactors Workflow

1. **Create Workflow**:
   - Go to **Admin Center** → **Workflow**
   - Create new workflow
   - Trigger: Compensation form submission or user action

2. **Add HTTP Action**:
   - Action Type: "Open URL"
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId={companyId}&userId={userId}&formId={formId}`
   - Method: GET
   - Open in: "New Tab" or "Embedded"

#### Option C: Using SuccessFactors Extension (iframe)

1. **Create Extension Point**:
   - In SuccessFactors, create a custom extension point
   - Use iframe to embed your BTP UI

2. **Embed Code**:
   ```html
   <iframe 
       src="https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId={userId}"
       width="100%" 
       height="800px"
       frameborder="0">
   </iframe>
   ```

## Method 2: Deep Link from SuccessFactors

### Step 1: Create Deep Link in SuccessFactors

1. **In SuccessFactors Admin Center**:
   - Go to **Manage Integration Tiles**
   - Create **External Link** tile
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html`

2. **Pass Parameters**:
   ```
   https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId={userId}&formId={formId}
   ```

### Step 2: Update BTP UI to Accept Parameters

Update `app/webapp/controller/CompensationWorksheet.controller.js`:

```javascript
onInit: function () {
    // Get URL parameters
    var oUriParams = new URLSearchParams(window.location.search);
    var sCompanyId = oUriParams.get('companyId') || "SFHUB003674";
    var sUserId = oUriParams.get('userId') || "";
    var sFormId = oUriParams.get('formId') || "";
    
    // Get or initialize compensation model
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    
    if (!oModel) {
        oModel = new JSONModel({
            companyId: sCompanyId,
            userId: sUserId,
            formId: sFormId,
            effectiveDate: "",
            totalEmployees: 0,
            CompensationWorksheet: []
        });
        oView.setModel(oModel, "compensation");
    } else {
        // Update with URL parameters
        oModel.setProperty("/companyId", sCompanyId);
        oModel.setProperty("/userId", sUserId);
        oModel.setProperty("/formId", sFormId);
    }
    
    // Auto-load data if userId provided
    if (sUserId) {
        setTimeout(function() {
            this.onRefresh();
        }.bind(this), 500);
    }
}
```

## Method 3: API Integration (Backend Only)

### Step 1: SuccessFactors Calls BTP APIs

In SuccessFactors, configure API calls to your BTP extension:

**GET Compensation Data**:
```
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com"
}
```

**UPDATE Compensation Data**:
```
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/updateCompensationData
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": [...]
}
```

## Method 4: SuccessFactors Home Page Widget

### Create Custom Widget

1. **In SuccessFactors**:
   - Go to **Admin Center** → **Manage Home Page**
   - Create **Custom Widget**
   - Add HTML/JavaScript to embed your BTP UI

2. **Widget Code**:
   ```html
   <div id="compensation-widget">
       <iframe 
           src="https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html"
           width="100%" 
           height="600px"
           frameborder="0">
       </iframe>
   </div>
   ```

## Complete Integration Flow

### Flow 1: User Opens from SuccessFactors

```
1. User clicks "Compensation Worksheet" tile in SuccessFactors
   ↓
2. SuccessFactors opens BTP UI (iframe or new tab)
   ↓
3. BTP UI loads with companyId/userId from URL
   ↓
4. BTP UI calls SuccessFactors API to get data
   ↓
5. User edits compensation in BTP UI
   ↓
6. User clicks Save
   ↓
7. BTP UI calls SuccessFactors API to update data
   ↓
8. SuccessFactors updates compensation records
```

### Flow 2: SuccessFactors Triggers Update

```
1. Compensation form submitted in SuccessFactors
   ↓
2. SuccessFactors workflow triggers
   ↓
3. Workflow calls BTP API (POST/UPDATE)
   ↓
4. BTP processes and stores data
   ↓
5. BTP UI can display updated data
```

## Configuration Steps

### Step 1: Update BTP UI for URL Parameters

I'll create the updated controller code for you.

### Step 2: Configure SuccessFactors Tile

1. Admin Center → Manage Integration Tiles
2. Create new tile
3. Set URL to your BTP app
4. Add to home page

### Step 3: Test Integration

1. Open SuccessFactors
2. Click "Compensation Worksheet" tile
3. BTP UI should open with pre-filled data
4. Test save functionality

## Security Considerations

### 1. Authentication
- Configure OAuth 2.0 between SuccessFactors and BTP
- Use XSUAA for BTP authentication
- Pass tokens securely

### 2. CORS Configuration
- Allow SuccessFactors domain in BTP
- Configure CORS headers in server.js

### 3. Data Privacy
- Ensure data encryption in transit
- Follow GDPR/data privacy regulations
- Log access for audit

## Next Steps

1. ✅ **Deploy BTP Extension** to production
2. ✅ **Get BTP App URL** after deployment
3. ✅ **Update Controller** to accept URL parameters
4. ✅ **Configure SuccessFactors Tile** in Admin Center
5. ✅ **Test Integration** end-to-end

## Quick Start

**Right Now:**
1. Deploy your BTP extension
2. Get the app URL
3. Create SuccessFactors tile pointing to that URL
4. Users can access Compensation Worksheet from SuccessFactors!

**I'll help you update the controller to accept URL parameters next!**
