const cds = require('@sap/cds');
const axios = require('axios');
const xsenv = require('@sap/xsenv');
const rbpService = require('./rbp-service');

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

  // GET Compensation Data from SuccessFactors Employee Compensation API v1
  this.on('getCompensationData', async (req) => {
    const { companyId, userId, formId } = req.data;
    
    try {
      // Check RBP permissions first
      const rbpCheck = await rbpService.checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
      if (!rbpCheck.hasPermission) {
        req.error(403, `User ${userId} does not have permission to view compensation data. Required permission: COMPENSATION_VIEW`);
        return;
      }
      
      console.log(`User ${userId} has RBP permission: ${rbpCheck.permissionType}, Role: ${rbpCheck.role}`);
      // Call SuccessFactors Employee Compensation API v1
      // API Reference: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation
      let endpoint = `/odata/v2/Employee_Compensation`;
      
      // Build filter query
      const filters = [];
      if (companyId) filters.push(`companyId eq '${companyId}'`);
      if (userId) filters.push(`userId eq '${userId}'`);
      if (formId) filters.push(`formId eq '${formId}'`);
      
      if (filters.length > 0) {
        endpoint += `?$filter=${filters.join(' and ')}`;
      }
      
      const sfData = await callSFAPI(endpoint);
      
      // Transform SuccessFactors Employee Compensation API v1 data to our format
      // Mapping based on: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation
      const compensationData = sfData.d?.results?.map(item => ({
        id: item.id || cds.utils.uuid(),
        companyId: item.companyId || companyId,
        userId: item.userId || userId,
        formId: item.formId || formId,
        employeeId: item.employeeId || item.empId,
        employeeName: item.employeeName || item.empName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        position: item.jobTitle || item.position,
        department: item.department || item.departmentName,
        currentSalary: item.currentSalary || item.baseSalary || item.salary,
        proposedSalary: item.proposedSalary || item.newSalary,
        meritIncrease: item.meritIncrease || item.meritPercent || item.meritIncreasePercent,
        meritIncreaseAmount: item.meritIncreaseAmount || item.meritDollar,
        promotionIncrease: item.promotionIncrease || item.promotionPercent || 0,
        promotionIncreaseAmount: item.promotionIncreaseAmount || item.promotionDollar || 0,
        adjustmentIncrease: item.adjustmentIncrease || item.adjustmentPercent || 0,
        adjustmentIncreaseAmount: item.adjustmentIncreaseAmount || item.adjustmentDollar || 0,
        lumpSum: item.lumpSum || item.lumpSumAmount || 0,
        totalIncrease: item.totalIncrease || item.totalIncreasePercent,
        totalIncreaseAmount: item.totalIncreaseAmount || item.totalRaise,
        newSalary: item.newSalary || item.finalSalary || item.proposedSalary,
        finalSalaryRate: item.finalSalaryRate || item.newSalaryRate,
        totalPay: item.totalPay || item.totalPayIncludingLumpSum,
        currency: item.currency || item.currencyCode || 'USD',
        effectiveDate: item.effectiveDate || item.effectiveDate,
        status: item.status || item.compensationStatus || 'Draft',
        comments: item.comments || item.notes,
        performanceRating: item.performanceRating || item.overallPerformanceRating,
        payGrade: item.payGrade,
        salaryRangeMin: item.salaryRangeMin,
        salaryRangeMax: item.salaryRangeMax,
        compaRatio: item.compaRatio,
        rangePenetration: item.rangePenetration,
        lastModified: item.lastModified || item.lastModifiedDate || new Date().toISOString(),
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
      // Check RBP permissions for edit
      const rbpCheck = await rbpService.checkUserRBP(userId, companyId, 'COMPENSATION_EDIT');
      if (!rbpCheck.hasPermission) {
        req.error(403, `User ${userId} does not have permission to edit compensation data. Required permission: COMPENSATION_EDIT`);
        return;
      }
      
      console.log(`User ${userId} has edit permission: ${rbpCheck.permissionType}`);
      const results = [];
      
      for (const item of data) {
        // Prepare update payload for SuccessFactors Employee Compensation API v1
        const updatePayload = {
          companyId: item.companyId || companyId,
          userId: item.userId || userId,
          formId: item.formId,
          employeeId: item.employeeId || item.empId,
          proposedSalary: item.proposedSalary || item.newSalary,
          meritIncrease: item.meritIncrease || item.meritPercent,
          meritIncreaseAmount: item.meritIncreaseAmount || item.meritDollar,
          promotionIncrease: item.promotionIncrease || item.promotionPercent,
          promotionIncreaseAmount: item.promotionIncreaseAmount || item.promotionDollar,
          adjustmentIncrease: item.adjustmentIncrease || item.adjustmentPercent,
          adjustmentIncreaseAmount: item.adjustmentIncreaseAmount || item.adjustmentDollar,
          lumpSum: item.lumpSum || item.lumpSumAmount,
          totalIncrease: item.totalIncrease || item.totalIncreasePercent,
          totalIncreaseAmount: item.totalIncreaseAmount || item.totalRaise,
          newSalary: item.newSalary || item.finalSalary,
          finalSalaryRate: item.finalSalaryRate,
          totalPay: item.totalPay || item.totalPayIncludingLumpSum,
          effectiveDate: item.effectiveDate,
          status: item.status || item.compensationStatus,
          comments: item.comments || item.notes
        };

        // Call SuccessFactors Employee Compensation API v1 UPDATE
        let endpoint;
        let method;
        
        if (item.id && item.id !== 'new') {
          // Update existing record
          endpoint = `/odata/v2/Employee_Compensation('${item.id}')`;
          method = 'PATCH';
        } else {
          // Create new record
          endpoint = `/odata/v2/Employee_Compensation`;
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

      // Call SuccessFactors Employee Compensation API v1 POST
      // API Reference: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation
      const endpoint = `/odata/v2/Employee_Compensation`;
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
      const searchEndpoint = `/odata/v2/Employee_Compensation?$filter=employeeId eq '${data.employeeId}' and formId eq '${data.formId}' and companyId eq '${companyId}'`;
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

        const endpoint = `/odata/v2/Employee_Compensation('${existingRecord.id}')`;
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

  // GET Workflow Status
  this.on('getWorkflowStatus', async (req) => {
    const { companyId, formId } = req.data;
    
    try {
      // In a real implementation, this would call SuccessFactors Workflow API
      // For now, return mock workflow data
      // TODO: Integrate with SuccessFactors Workflow API
      
      const workflowStatus = {
        companyId: companyId,
        formId: formId,
        overallStatus: "In Progress",
        currentStep: "Step 2: Manager Review",
        initiatedBy: "System",
        initiatedDate: new Date().toLocaleDateString(),
        steps: [
          {
            stepNumber: 1,
            stepName: "Initiated",
            status: "Completed",
            statusState: "Success",
            assigneeName: "System User",
            assigneeRole: "Initiator",
            assigneePhoto: "sap-icon://employee",
            assigneeId: "system",
            completedDate: new Date().toLocaleDateString(),
            comments: "Compensation form created and submitted",
            dueDate: ""
          },
          {
            stepNumber: 2,
            stepName: "Manager Review",
            status: "In Progress",
            statusState: "Warning",
            assigneeName: "John Manager",
            assigneeRole: "Direct Manager",
            assigneePhoto: "sap-icon://manager",
            assigneeId: "manager001",
            completedDate: "",
            comments: "",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          {
            stepNumber: 3,
            stepName: "HR Review",
            status: "Pending",
            statusState: "None",
            assigneeName: "Sarah HR",
            assigneeRole: "HR Manager",
            assigneePhoto: "sap-icon://employee",
            assigneeId: "hr001",
            completedDate: "",
            comments: "",
            dueDate: ""
          },
          {
            stepNumber: 4,
            stepName: "Finance Approval",
            status: "Pending",
            statusState: "None",
            assigneeName: "Mike Finance",
            assigneeRole: "Finance Director",
            assigneePhoto: "sap-icon://money-bills",
            assigneeId: "finance001",
            completedDate: "",
            comments: "",
            dueDate: ""
          },
          {
            stepNumber: 5,
            stepName: "Final Approval",
            status: "Pending",
            statusState: "None",
            assigneeName: "Lisa Executive",
            assigneeRole: "VP of HR",
            assigneePhoto: "sap-icon://approvals",
            assigneeId: "exec001",
            completedDate: "",
            comments: "",
            dueDate: ""
          },
          {
            stepNumber: 6,
            stepName: "Completed",
            status: "Pending",
            statusState: "None",
            completedDate: ""
          }
        ],
        employees: []
      };

      // Try to get employee data for this form
      try {
        const compEndpoint = `/odata/v2/Employee_Compensation?$filter=formId eq '${formId}' and companyId eq '${companyId}'`;
        const compData = await callSFAPI(compEndpoint);
        
        if (compData.d?.results) {
          workflowStatus.employees = compData.d.results.map(emp => ({
            employeeId: emp.employeeId,
            employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
            photo: emp.photo || "sap-icon://employee",
            finalSalary: emp.finalSalary || emp.newSalary,
            status: emp.status || "Pending"
          }));
        }
      } catch (error) {
        console.log("Could not load employee data for workflow:", error.message);
      }

      return workflowStatus;
    } catch (error) {
      req.error(500, `Failed to fetch workflow status: ${error.message}`);
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
