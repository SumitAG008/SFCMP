# Quick Guide: BTP ↔ SuccessFactors Interaction

## 🔄 How They Interact

### Direction 1: SuccessFactors → BTP

**When**: SuccessFactors needs to send data to BTP

**How**:
1. SuccessFactors workflow/integration calls BTP API
2. BTP Extension receives request
3. BTP processes and stores data
4. Data appears in UI5 worksheet

**Example**:
```
SuccessFactors Workflow
  → POST /compensation/CompensationService/postCompensationData
  → BTP Extension receives
  → UI5 Worksheet displays
```

---

### Direction 2: BTP → SuccessFactors

**When**: User updates data in BTP, needs to sync to SuccessFactors

**How**:
1. User edits in BTP UI5 worksheet
2. User clicks "Save"
3. BTP Extension calls SuccessFactors API
4. SuccessFactors updates compensation records

**Example**:
```
BTP UI5 Worksheet
  → User clicks Save
  → POST /compensation/CompensationService/updateCompensationData
  → BTP Extension calls SuccessFactors API
  → POST /odata/v2/Employee_Compensation
  → SuccessFactors updates
```

---

### Direction 3: BTP → SuccessFactors → BTP (Full Cycle)

**When**: Complete bidirectional sync

**How**:
1. BTP fetches from SuccessFactors (GET)
2. User edits in BTP
3. BTP saves to SuccessFactors (POST)
4. BTP refreshes from SuccessFactors (GET)

**Example**:
```
1. GET from SuccessFactors → BTP
2. User edits in BTP
3. POST to SuccessFactors ← BTP
4. GET from SuccessFactors → BTP (refresh)
```

---

## 🚀 Quick Setup

### 1. Configure SuccessFactors Credentials in BTP

```bash
# In Cloud Foundry
cf create-user-provided-service successfactors-credentials \
  -p '{
    "url": "https://api.successfactors.eu",
    "username": "sfadmin",
    "password": "Part@dc57",
    "companyId": "SFHUB003674"
  }'
```

### 2. Deploy BTP Extension

```bash
mbt build
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### 3. Configure SuccessFactors to Call BTP

**In SuccessFactors Integration Center**:
- Create OData destination
- URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/`
- Authentication: Configure as needed

---

## 📋 API Endpoints

### BTP Extension APIs (SuccessFactors calls these)

```
GET  /compensation/CompensationService/getCompensationData
POST /compensation/CompensationService/postCompensationData
POST /compensation/CompensationService/updateCompensationData
POST /compensation/CompensationService/upsertCompensationData
```

### SuccessFactors APIs (BTP calls these)

```
GET   /odata/v2/Employee_Compensation
POST  /odata/v2/Employee_Compensation
PATCH /odata/v2/Employee_Compensation('{id}')
```

---

## ✅ Test Interaction

### From BTP UI:
1. Open: `http://localhost:4004/app/index.html`
2. Enter: Company ID, User ID, Form ID
3. Click: **Refresh** (GET from SuccessFactors)
4. Edit: Compensation data
5. Click: **Save** (POST to SuccessFactors)

### From SuccessFactors:
1. Create workflow
2. Add HTTP action
3. Call BTP Extension API
4. Test workflow

---

**That's it! Your BTP and SuccessFactors are now connected!** 🎉
