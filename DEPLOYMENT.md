# SAP BTP Deployment Guide

## Information Needed

To deploy this application to your SAP BTP instance, I need the following information:

### 1. SAP BTP Account Details
- **BTP Subaccount Name/ID**: 
- **Cloud Foundry Organization**: 
- **Cloud Foundry Space**: 
- **BTP Region** (e.g., us10, eu10, ap21): 
- **CF API Endpoint** (e.g., https://api.cf.eu10.hana.ondemand.com): 

### 2. Cloud Foundry Credentials
- **CF Username/Email**: 
- **CF Password**: (or we can use SSO)

### 3. SuccessFactors Service Configuration
- **SuccessFactors API URL**: (e.g., https://api.successfactors.eu)
- **SuccessFactors Username**: 
- **SuccessFactors Password**: 
- **Company ID**: (e.g., SFHUB003674)

### 4. Database Service (Optional - for production)
- **HANA Database Service Plan**: (hdi-shared, hdi-dedicated, etc.)
- Or confirm if you want to use SQLite for development

## Deployment Steps

### Step 1: Install Prerequisites

```bash
# Install Cloud Foundry CLI
# Download from: https://github.com/cloudfoundry/cli/releases

# Install MTA Build Tool
npm install -g mbt
```

### Step 2: Login to Cloud Foundry

```bash
cf login -a <CF_API_ENDPOINT> -u <USERNAME> -o <ORG> -s <SPACE>
```

### Step 3: Create SuccessFactors User-Provided Service

```bash
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","username":"YOUR_USERNAME","password":"YOUR_PASSWORD","companyId":"SFHUB003674"}'
```

### Step 4: Create Database Service (if using HANA)

```bash
cf create-service hana hdi-shared compensation-db
```

### Step 5: Build MTA Archive

```bash
mbt build
```

### Step 6: Deploy to BTP

```bash
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

## Alternative: Direct Cloud Foundry Deployment

If you prefer not to use MTA, you can deploy directly:

```bash
# Deploy backend service
cd srv
cf push compensation-service --manifest ../manifest.yml

# Deploy frontend app
cd ../app
cf push compensation-app --manifest ../manifest.yml
```

## Post-Deployment

1. **Get Application URLs**:
   ```bash
   cf apps
   ```

2. **View Logs**:
   ```bash
   cf logs compensation-service --recent
   ```

3. **Access Application**:
   - Frontend: https://compensation-app-<space>.cfapps.<domain>
   - Backend API: https://compensation-service-<space>.cfapps.<domain>

## Troubleshooting

### Service Binding Issues
```bash
# Check service bindings
cf services
cf service successfactors-credentials
```

### Authentication Issues
- Verify XSUAA service is created and bound
- Check xs-security.json configuration
- Review application logs for authentication errors

### Database Issues
```bash
# Check database service status
cf service compensation-db
```
