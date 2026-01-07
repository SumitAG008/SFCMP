# SuccessFactors Integration - Step by Step

## ✅ Current Status
- UI is working and visible! 🎉
- Compensation Worksheet is functional
- Ready for SuccessFactors integration

## Quick Integration Steps

### Step 1: Deploy BTP Extension

```bash
# Build MTA
mbt build

# Deploy to BTP
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### Step 2: Get Your BTP App URL

After deployment:
```bash
cf apps
# Copy the URL, e.g.:
# https://compensation-app-<space>.cfapps.us10-001.hana.ondemand.com
```

### Step 3: Configure SuccessFactors Tile

1. **Login to SuccessFactors**
2. **Go to Admin Center** → **Manage Integration Tiles**
3. **Click "Create New Tile"**
4. **Configure**:
   - **Title**: "Compensation Worksheet"
   - **URL**: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674`
   - **Type**: "External Link" or "Embedded Content"
   - **Icon**: Choose compensation/money icon
   - **Target**: "New Window" (recommended) or "Same Window"
5. **Save**

### Step 4: Add to Home Page

1. **Go to Admin Center** → **Manage Home Page**
2. **Add the tile** to user's home page
3. **Users will see** "Compensation Worksheet" tile

### Step 5: Test Integration

1. **Login to SuccessFactors** as a user
2. **Click "Compensation Worksheet"** tile
3. **BTP UI opens** with pre-filled Company ID
4. **Enter User ID** and click Refresh
5. **Data loads** from SuccessFactors
6. **Edit and Save** - updates go back to SuccessFactors

## URL Parameters Supported

Your BTP UI now accepts these URL parameters:

- `companyId` - Company ID (default: SFHUB003674)
- `userId` - User ID (auto-loads data if provided)
- `formId` - Form ID
- `effectiveDate` - Effective date

**Example URLs**:
```
# Basic
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html

# With parameters
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId=sfadmin&formId=EmpComp

# From SuccessFactors (with SF parameters)
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?bplte_company=SFHUB003674&user=sfadmin
```

## Integration Methods

### Method 1: Tile (Recommended)
- ✅ Easy to configure
- ✅ Users see it on home page
- ✅ One click to access

### Method 2: iframe Embed
- Embed in SuccessFactors page
- Seamless user experience
- Requires iframe configuration

### Method 3: Deep Link
- Link from compensation forms
- Pass context (employee, form, etc.)
- Opens in new window

### Method 4: API Only
- Backend integration
- No UI exposure
- For automated processes

## What Happens When User Clicks Tile

1. **SuccessFactors** opens BTP URL
2. **BTP UI loads** with Company ID from URL
3. **If User ID in URL**: Auto-loads compensation data
4. **User edits** compensation values
5. **User clicks Save**: Updates SuccessFactors via API
6. **SuccessFactors** updates compensation records

## Features Now Available

✅ **URL Parameters** - Accepts companyId, userId, formId from URL
✅ **Auto-Load Data** - If userId provided, automatically loads data
✅ **CORS Enabled** - SuccessFactors can embed/access the UI
✅ **Bidirectional Sync** - GET from SF, UPDATE to SF
✅ **Full CRUD** - Create, Read, Update, Delete operations

## Next Steps

1. **Deploy to BTP** (if not already done)
2. **Get App URL**
3. **Create SuccessFactors Tile**
4. **Test end-to-end**
5. **Configure for production users**

## Troubleshooting

### Issue: Tile doesn't open
- Check BTP app URL is correct
- Verify app is deployed and running
- Check browser console for errors

### Issue: Data doesn't load
- Verify User ID is correct
- Check SuccessFactors API credentials
- Check browser console for API errors

### Issue: Save doesn't work
- Check SuccessFactors API permissions
- Verify API credentials in BTP
- Check network tab for API calls

## Summary

**Your Compensation Worksheet is now ready for SuccessFactors integration!**

Just:
1. Deploy to BTP
2. Create SuccessFactors tile
3. Users can access from SuccessFactors home page!

🎉 **You're all set!**
