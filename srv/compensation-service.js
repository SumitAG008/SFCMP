const cds = require('@sap/cds');
const axios = require('axios');
const xsenv = require('@sap/xsenv');

module.exports = cds.service.impl(async function() {
  const { CompensationWorksheet } = this.entities;
  
  // Get SuccessFactors credentials from environment
  let sfCredentials;
  try {
    sfCredentials = xsenv.getServices({ SuccessFactors: { tag: 'successfactors' } }).SuccessFactors;
  } catch (e) {
    // Fallback to environment variables
    sfCredentials = {
      url: process.env.SF_URL || 'https://api.successfactors.eu',
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
      companyId: process.env.SF_COMPANY_ID || 'SFHUB003674'
    };
  }

  // Helper function to get authentication header
  async function getAuthHeader() {
    try {
      // Try OAuth first if client credentials are available
      if (sfCredentials.clientId && sfCredentials.clientSecret) {
        const tokenUrl = `${sfCredentials.url}/oauth/token`;
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: sfCredentials.clientId,
          client_secret: sfCredentials.clientSecret
        });

        const response = await axios.post(tokenUrl, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        return `Bearer ${response.data.access_token}`;
      }
      
      // Fallback to Basic Auth
      if (sfCredentials.username && sfCredentials.password) {
        const credentials = Buffer.from(`${sfCredentials.username}:${sfCredentials.password}`).toString('base64');
        return `Basic ${credentials}`;
      }
      
      throw new Error('No authentication credentials provided');
    } catch (error) {
      console.error('Error getting authentication:', error.message);
      throw new Error('Failed to authenticate with SuccessFactors');
    }
  }

  // Helper function to make SuccessFactors API calls
  async function callSFAPI(endpoint, method = 'GET', data = null) {
    try {
      const authHeader = await getAuthHeader();
      const url = `${sfCredentials.url}${endpoint}`;
      
      const config = {
        method,
        url,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Error calling SuccessFactors API ${endpoint}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  // GET Compensation Data from SuccessFactors
  this.on('getCompensationData', async (req) => {
    const { companyId, userId } = req.data;
    
    try {
      // Call SuccessFactors Compensation API
      // Adjust the endpoint based on your SuccessFactors API version
      const endpoint = `/odata/v2/CompensationData?$filter=companyId eq '${companyId}' and userId eq '${userId}'`;
      const sfData = await callSFAPI(endpoint);
      
      // Transform SuccessFactors data to our format
      const compensationData = sfData.d?.results?.map(item => ({
        id: item.id || cds.utils.uuid(),
        companyId: item.companyId || companyId,
        userId: item.userId || userId,
        formId: item.formId,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        position: item.position,
        department: item.department,
        currentSalary: item.currentSalary,
        proposedSalary: item.proposedSalary,
        meritIncrease: item.meritIncrease,
        promotionIncrease: item.promotionIncrease,
        adjustmentIncrease: item.adjustmentIncrease,
        totalIncrease: item.totalIncrease,
        newSalary: item.newSalary,
        currency: item.currency || 'USD',
        effectiveDate: item.effectiveDate,
        status: item.status,
        comments: item.comments,
        lastModified: item.lastModified || new Date().toISOString(),
        lastModifiedBy: item.lastModifiedBy || userId
      })) || [];
      
      return compensationData;
    } catch (error) {
      req.error(500, `Failed to fetch compensation data: ${error.message}`);
    }
  });

  // UPDATE Compensation Data to SuccessFactors
  this.on('updateCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    try {
      const results = [];
      
      for (const item of data) {
        // Prepare update payload for SuccessFactors
        const updatePayload = {
          companyId: item.companyId || companyId,
          userId: item.userId || userId,
          formId: item.formId,
          employeeId: item.employeeId,
          proposedSalary: item.proposedSalary,
          meritIncrease: item.meritIncrease,
          promotionIncrease: item.promotionIncrease,
          adjustmentIncrease: item.adjustmentIncrease,
          totalIncrease: item.totalIncrease,
          newSalary: item.newSalary,
          effectiveDate: item.effectiveDate,
          status: item.status,
          comments: item.comments
        };

        // Call SuccessFactors UPDATE API
        let endpoint;
        let method;
        
        if (item.id && item.id !== 'new') {
          // Update existing record
          endpoint = `/odata/v2/CompensationData('${item.id}')`;
          method = 'PATCH';
        } else {
          // Create new record
          endpoint = `/odata/v2/CompensationData`;
          method = 'POST';
        }

        const sfResponse = await callSFAPI(endpoint, method, updatePayload);
        results.push(sfResponse);
      }
      
      return { success: true, updated: results.length, results };
    } catch (error) {
      req.error(500, `Failed to update compensation data: ${error.message}`);
    }
  });

  // POST - Create new compensation record
  this.on('postCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    try {
      // Prepare payload for SuccessFactors
      const postPayload = {
        companyId: data.companyId || companyId,
        userId: data.userId || userId,
        formId: data.formId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        position: data.position,
        department: data.department,
        currentSalary: data.currentSalary,
        proposedSalary: data.proposedSalary,
        meritIncrease: data.meritIncrease,
        promotionIncrease: data.promotionIncrease,
        adjustmentIncrease: data.adjustmentIncrease,
        totalIncrease: data.totalIncrease,
        newSalary: data.newSalary,
        currency: data.currency || 'USD',
        effectiveDate: data.effectiveDate,
        status: data.status || 'Draft',
        comments: data.comments
      };

      // Call SuccessFactors POST API
      const endpoint = `/odata/v2/CompensationData`;
      const sfResponse = await callSFAPI(endpoint, 'POST', postPayload);
      
      // Transform and return
      return {
        id: sfResponse.d?.id || cds.utils.uuid(),
        ...postPayload,
        lastModified: new Date().toISOString(),
        lastModifiedBy: userId
      };
    } catch (error) {
      req.error(500, `Failed to create compensation data: ${error.message}`);
    }
  });

  // UPSERT - Insert or Update (Update if exists, Insert if not)
  this.on('upsertCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    try {
      // First, try to find existing record by employeeId and formId
      const searchEndpoint = `/odata/v2/CompensationData?$filter=employeeId eq '${data.employeeId}' and formId eq '${data.formId}' and companyId eq '${companyId}'`;
      const existingData = await callSFAPI(searchEndpoint);
      
      const existingRecord = existingData.d?.results?.[0];
      
      if (existingRecord) {
        // UPDATE existing record
        const updatePayload = {
          proposedSalary: data.proposedSalary !== undefined ? data.proposedSalary : existingRecord.proposedSalary,
          meritIncrease: data.meritIncrease !== undefined ? data.meritIncrease : existingRecord.meritIncrease,
          promotionIncrease: data.promotionIncrease !== undefined ? data.promotionIncrease : existingRecord.promotionIncrease,
          adjustmentIncrease: data.adjustmentIncrease !== undefined ? data.adjustmentIncrease : existingRecord.adjustmentIncrease,
          totalIncrease: data.totalIncrease !== undefined ? data.totalIncrease : existingRecord.totalIncrease,
          newSalary: data.newSalary !== undefined ? data.newSalary : existingRecord.newSalary,
          effectiveDate: data.effectiveDate || existingRecord.effectiveDate,
          status: data.status || existingRecord.status,
          comments: data.comments !== undefined ? data.comments : existingRecord.comments
        };

        const endpoint = `/odata/v2/CompensationData('${existingRecord.id}')`;
        const sfResponse = await callSFAPI(endpoint, 'PATCH', updatePayload);
        
        return {
          id: existingRecord.id,
          ...existingRecord,
          ...updatePayload,
          lastModified: new Date().toISOString(),
          lastModifiedBy: userId
        };
      } else {
        // INSERT new record
        return await this.on('postCompensationData', {
          data: { companyId, userId, data }
        });
      }
    } catch (error) {
      req.error(500, `Failed to upsert compensation data: ${error.message}`);
    }
  });

  // Standard OData CRUD operations (for direct API calls from SuccessFactors)
  this.on('READ', CompensationWorksheet, async (req) => {
    const query = req.query;
    const params = query.SELECT?.where || [];
    
    // Extract companyId and userId from query parameters
    let companyId, userId;
    params.forEach(param => {
      if (param.ref && param.ref[0] === 'companyId' && param.val) {
        companyId = param.val;
      }
      if (param.ref && param.ref[0] === 'userId' && param.val) {
        userId = param.val;
      }
    });
    
    // Also check URL parameters
    if (req.query && !companyId) {
      companyId = req.query.companyId || req._.req.query.companyId;
      userId = req.query.userId || req._.req.query.userId;
    }
    
    if (companyId && userId) {
      // Fetch from SuccessFactors via custom function
      const result = await this.on('getCompensationData', { data: { companyId, userId } });
      return result;
    }
    
    // Otherwise, return from local database
    return await cds.run(req.query);
  });

  this.before('CREATE', CompensationWorksheet, async (req) => {
    req.data.id = req.data.id || cds.utils.uuid();
    req.data.lastModified = new Date().toISOString();
    if (!req.data.lastModifiedBy && req.user?.id) {
      req.data.lastModifiedBy = req.user.id;
    }
  });

  this.before('UPDATE', CompensationWorksheet, async (req) => {
    req.data.lastModified = new Date().toISOString();
    if (!req.data.lastModifiedBy && req.user?.id) {
      req.data.lastModifiedBy = req.user.id;
    }
  });

  // After CREATE - sync to SuccessFactors
  this.after('CREATE', CompensationWorksheet, async (data, req) => {
    try {
      const companyId = data.companyId || req.data.companyId;
      const userId = data.userId || req.data.userId || req.user?.id;
      
      if (companyId && userId) {
        await this.on('postCompensationData', {
          data: { companyId, userId, data }
        });
      }
    } catch (error) {
      console.error('Failed to sync CREATE to SuccessFactors:', error);
      // Don't fail the request if sync fails
    }
  });

  // After UPDATE - sync to SuccessFactors
  this.after('UPDATE', CompensationWorksheet, async (data, req) => {
    try {
      const companyId = data.companyId || req.data.companyId;
      const userId = data.userId || req.data.userId || req.user?.id;
      
      if (companyId && userId) {
        await this.on('updateCompensationData', {
          data: {
            companyId,
            userId,
            data: [data]
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync UPDATE to SuccessFactors:', error);
      // Don't fail the request if sync fails
    }
  });
});
