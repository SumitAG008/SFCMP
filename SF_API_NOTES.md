# SuccessFactors API Integration Notes

## API Endpoint Configuration

The compensation service integrates with SuccessFactors using OData APIs. The actual endpoint structure may vary based on your SuccessFactors instance configuration.

### Common SuccessFactors API Patterns

1. **OData v2 Standard**:
   ```
   /odata/v2/CompensationData
   /odata/v2/CompensationData('{id}')
   ```

2. **OData v4**:
   ```
   /odata/v4/CompensationData
   /odata/v4/CompensationData('{id}')
   ```

3. **Custom API**:
   ```
   /api/compensation/v1/data
   /api/compensation/v1/data/{id}
   ```

## Customizing API Endpoints

Edit `srv/compensation-service.js` and update the endpoint paths in:

1. **GET Function** (line ~60):
   ```javascript
   const endpoint = `/odata/v2/CompensationData?$filter=companyId eq '${companyId}' and userId eq '${userId}'`;
   ```

2. **UPDATE Function** (line ~100):
   ```javascript
   endpoint = `/odata/v2/CompensationData('${item.id}')`;  // For updates
   endpoint = `/odata/v2/CompensationData`;  // For creates
   ```

## SuccessFactors Data Model Mapping

The service maps SuccessFactors fields to the local schema. Common field mappings:

| SuccessFactors Field | Local Schema Field |
|---------------------|-------------------|
| `userId` | `userId` |
| `companyId` | `companyId` |
| `employeeId` | `employeeId` |
| `currentSalary` | `currentSalary` |
| `proposedSalary` | `proposedSalary` |
| `meritIncrease` | `meritIncrease` |
| `promotionIncrease` | `promotionIncrease` |
| `adjustmentIncrease` | `adjustmentIncrease` |
| `totalIncrease` | `totalIncrease` |
| `newSalary` | `newSalary` |

**Note**: Adjust the field mappings in the `getCompensationData` function based on your SuccessFactors entity structure.

## Authentication Methods

The service supports two authentication methods:

1. **OAuth 2.0** (Preferred):
   - Requires `clientId` and `clientSecret`
   - Uses client credentials flow
   - Token endpoint: `/oauth/token`

2. **Basic Authentication** (Fallback):
   - Uses `username` and `password`
   - Base64 encoded credentials

## API Response Format

### GET Response Format

SuccessFactors typically returns data in this format:

```json
{
  "d": {
    "results": [
      {
        "id": "uuid",
        "companyId": "SFHUB003674",
        "userId": "user@example.com",
        ...
      }
    ]
  }
}
```

### UPDATE Response Format

SuccessFactors typically returns:

```json
{
  "d": {
    "id": "uuid",
    "status": "updated",
    ...
  }
}
```

## Testing API Connectivity

You can test the SuccessFactors API connection directly:

```bash
# Test OAuth Token
curl -X POST https://api.successfactors.eu/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"

# Test API Call with Basic Auth
curl -X GET "https://api.successfactors.eu/odata/v2/CompensationData" \
  -H "Authorization: Basic BASE64_CREDENTIALS" \
  -H "Accept: application/json"
```

## Common Issues

1. **403 Forbidden**: Check user permissions in SuccessFactors
2. **404 Not Found**: Verify the API endpoint path
3. **401 Unauthorized**: Check credentials and authentication method
4. **500 Internal Server Error**: Verify data format matches SuccessFactors expectations

## SuccessFactors API Documentation

Refer to your SuccessFactors instance API documentation:
- API Business Hub: https://api.sap.com/
- SuccessFactors OData API: https://help.sap.com/viewer/product/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL/2105/en-US
