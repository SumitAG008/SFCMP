# Quick Start Guide

## Prerequisites Setup

1. **Install Node.js** (v16 or higher)
2. **Install SAP CAP CLI**:
   ```bash
   npm install -g @sap/cds-dk
   ```

## Local Development Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure SuccessFactors Connection

Create a `.env` file in the root directory with your SuccessFactors credentials:

```env
SF_URL=https://api.successfactors.eu
SF_USERNAME=sfadmin
SF_PASSWORD=Part@dc57
SF_COMPANY_ID=SFHUB003674
```

**Note**: Adjust the `SF_URL` based on your SuccessFactors data center:
- EU: `https://api.successfactors.eu`
- US: `https://api.successfactors.com`
- APJ: `https://api.successfactors.com` (with different region)

### Step 3: Start the Application

```bash
npm start
```

The application will be available at:
- **Backend API**: http://localhost:4004
- **Frontend UI**: http://localhost:4004/app/index.html
- **OData Service**: http://localhost:4004/compensation/CompensationService

### Step 4: Test the Application

1. Open http://localhost:4004/app/index.html in your browser
2. Enter your Company ID: `SFHUB003674`
3. Enter your User ID (your SuccessFactors username)
4. Click **Refresh** to load data from SuccessFactors
5. Make changes to the compensation data
6. Click **Save** to update SuccessFactors

## API Testing

### Test GET API

```bash
curl -X POST http://localhost:4004/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "your_user_id"
  }'
```

### Test UPDATE API

```bash
curl -X POST http://localhost:4004/compensation/CompensationService/updateCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "your_user_id",
    "data": [{
      "employeeId": "EMP001",
      "proposedSalary": 105000,
      "meritIncrease": 3.0,
      "status": "Draft"
    }]
  }'
```

## SuccessFactors API Endpoint Configuration

The default implementation uses OData v2 endpoints. You may need to adjust the endpoints in `srv/compensation-service.js` based on your SuccessFactors API version:

- **OData v2**: `/odata/v2/CompensationData`
- **OData v4**: `/odata/v4/CompensationData`
- **REST API**: `/api/compensation/v1/data`

## Troubleshooting

### Connection Issues

1. **Check credentials**: Verify your username and password in `.env`
2. **Check URL**: Ensure the SuccessFactors API URL matches your data center
3. **Check network**: Verify you can access SuccessFactors from your machine

### API Errors

1. **401 Unauthorized**: Check your credentials
2. **404 Not Found**: Verify the API endpoint path
3. **500 Internal Server Error**: Check the SuccessFactors API version compatibility

### View Logs

```bash
# View CAP server logs
npm start

# Or if running in watch mode
npm run watch
```

## Next Steps

- Review the [README.md](README.md) for detailed documentation
- Customize the UI in `app/webapp/view/CompensationWorksheet.view.xml`
- Adjust the data model in `db/schema.cds`
- Configure deployment in `mta.yaml` for SAP BTP
