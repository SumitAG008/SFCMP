# SuccessFactors Compensation Extension on SAP BTP

This project provides a SuccessFactors Compensation Extension built on SAP Business Technology Platform (BTP). It replicates the SuccessFactors compensation worksheet functionality with full GET and UPDATE API integration.

## Features

- **Compensation Worksheet UI**: A UI5 application that mimics the SuccessFactors compensation worksheet interface
- **GET API**: Fetches compensation data from SuccessFactors
- **UPDATE API**: Updates compensation data back to SuccessFactors
- **Bidirectional Sync**: Real-time synchronization between BTP and SuccessFactors
- **SAP CAP Backend**: Cloud Application Programming model for backend services
- **UI5 Frontend**: Modern, responsive UI matching SuccessFactors design

## Project Structure

```
.
├── app/                    # UI5 Frontend Application
│   └── webapp/
│       ├── Component.js
│       ├── controller/
│       ├── view/
│       ├── model/
│       └── manifest.json
├── db/                     # Database Schema
│   └── schema.cds
├── srv/                    # Backend Services
│   ├── compensation-service.cds
│   └── compensation-service.js
├── package.json
├── mta.yaml               # Multi-Target Application descriptor
└── xs-security.json       # Security configuration
```

## Prerequisites

- Node.js (v16 or higher)
- SAP BTP account with Cloud Foundry environment
- SuccessFactors instance with API access
- SuccessFactors credentials (username/password or OAuth)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SuccessFactors Connection

Create a file `.env` in the root directory:

```env
SF_URL=https://api.successfactors.eu
SF_USERNAME=your_username
SF_PASSWORD=your_password
SF_COMPANY_ID=SFHUB003674
```

Or configure via SAP BTP Service Binding:

1. Create a User-Provided Service in Cloud Foundry:
```bash
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","username":"your_username","password":"your_password","companyId":"SFHUB003674"}'
```

### 3. Local Development

Start the CAP server:

```bash
npm start
```

The application will be available at:
- Backend: http://localhost:4004
- Frontend: http://localhost:4004/app/index.html

### 4. Deploy to SAP BTP

#### Build the MTA Archive

```bash
npm install -g mbt
mbt build
```

#### Deploy to Cloud Foundry

```bash
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

## API Endpoints

### GET Compensation Data

**Endpoint**: `POST /compensation/CompensationService/getCompensationData`

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
    "id": "uuid",
    "companyId": "SFHUB003674",
    "userId": "user@example.com",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "currentSalary": 100000,
    "proposedSalary": 105000,
    "meritIncrease": 3.0,
    "promotionIncrease": 2.0,
    "totalIncrease": 5.0,
    "newSalary": 105000,
    "currency": "USD",
    "status": "Draft"
  }
]
```

### UPDATE Compensation Data

**Endpoint**: `POST /compensation/CompensationService/updateCompensationData`

**Request Body**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP001",
      "proposedSalary": 105000,
      "meritIncrease": 3.0,
      "status": "Pending"
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

## SuccessFactors API Integration

The service integrates with SuccessFactors using OData v2 API. The integration supports:

- **Authentication**: OAuth 2.0 Client Credentials flow
- **Data Model**: Maps SuccessFactors compensation entities to local schema
- **Error Handling**: Comprehensive error handling and logging

### Customizing SuccessFactors API Endpoints

Edit `srv/compensation-service.js` to adjust the API endpoints based on your SuccessFactors instance:

```javascript
// Adjust these endpoints based on your SF API version
const endpoint = `/odata/v2/CompensationData?$filter=...`;
```

## UI Features

- **Compensation Worksheet Table**: Editable table with all compensation fields
- **Auto-calculation**: Automatically calculates total increase and new salary
- **Add/Delete Rows**: Add new employees or delete existing entries
- **Save/Refresh**: Sync data with SuccessFactors
- **Status Management**: Track compensation status (Draft, Pending, Approved, Rejected)

## Security

- XSUAA authentication configured
- Role-based access control (CompensationUser, CompensationAdmin)
- Secure API communication with SuccessFactors

## Troubleshooting

### Connection Issues

1. Verify SuccessFactors credentials in `.env` or service binding
2. Check network connectivity to SuccessFactors API
3. Verify OAuth token generation

### API Errors

1. Check SuccessFactors API version compatibility
2. Verify entity names match your SuccessFactors instance
3. Review error logs in Cloud Foundry: `cf logs compensation-service --recent`

## Support

For issues or questions, please refer to:
- [SAP BTP Documentation](https://help.sap.com/viewer/product/CP/Cloud/en-US)
- [SuccessFactors API Documentation](https://api.sap.com/api/SuccessFactors_EC_ODATA_V2/overview)

## License

Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
