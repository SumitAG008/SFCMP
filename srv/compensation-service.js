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
      
      // Call SuccessFactors Employee Compensations API
      // API Reference: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation
      // This API accesses data from salary, bonus, and stock tabs, plus performance rating and force comments
      let endpoint = `/odata/v2/employeeCompensations`;
      
      // Build filter query - use templateId (formId) to get compensation worksheet data
      const filters = [];
      if (companyId) filters.push(`companyId eq '${companyId}'`);
      if (formId) {
        // Use templateId to filter by compensation template/form
        filters.push(`templateId eq '${formId}'`);
      }
      
      // Select all relevant fields from salary, bonus, stock tabs
      const selectFields = [
        'employeeId',
        'employeeName',
        'currentSalary',
        'currency',
        'meritIncrease',
        'meritIncreaseAmount',
        'adjustmentIncrease',
        'adjustmentIncreaseAmount',
        'lumpSum',
        'finalSalary',
        'totalPayIncludingLumpSum',
        'effectiveDate',
        'performanceRating',
        'performanceRatingText',
        'forceComments',
        'managerComments',
        'jobTitle',
        'department',
        'location',
        'hireDate',
        'payGrade',
        'salaryRangeMin',
        'salaryRangeMax',
        'compaRatio',
        'rangePenetration',
        'bonusTarget',
        'bonusActual',
        'stockGrant',
        'stockVested',
        'equityValue'
      ];
      
      if (filters.length > 0) {
        endpoint += `?$filter=${filters.join(' and ')}`;
        endpoint += `&$select=${selectFields.join(',')}`;
      } else {
        endpoint += `?$select=${selectFields.join(',')}`;
      }
      
      const sfData = await callSFAPI(endpoint);
      
      // Transform SuccessFactors Employee Compensations API data to our worksheet format
      // This API provides data from salary, bonus, stock tabs, plus performance rating and force comments
      const compensationData = sfData.d?.results?.map(item => ({
        // Employee Information (Read-only from SF - Red highlighted)
        id: item.id || cds.utils.uuid(),
        companyId: item.companyId || companyId,
        userId: item.userId || userId,
        formId: item.formId || formId,
        employeeId: item.employeeId || item.empId,
        employeeName: item.employeeName || item.empName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        jobTitle: item.jobTitle || item.position || '',
        department: item.department || item.departmentName || '',
        location: item.location || '',
        hireDate: item.hireDate || '',
        
        // Current Pay Information (Read-only from SF - Red highlighted)
        currentSalary: item.currentSalary || item.baseSalary || item.salary || 0,
        currency: item.currency || item.currencyCode || 'USD',
        payGrade: item.payGrade || '',
        salaryRangeMin: item.salaryRangeMin || 0,
        salaryRangeMax: item.salaryRangeMax || 0,
        compaRatio: item.compaRatio || 0,
        rangePenetration: item.rangePenetration || 0,
        
        // Performance Rating (Read-only from SF - Red highlighted)
        overallPerformance: item.performanceRating || item.overallPerformanceRating || 0,
        overallPerformanceText: item.performanceRatingText || item.performanceRating || '',
        
        // Editable Fields (Green highlighted - User can edit with RBP control)
        merit: item.meritIncrease || item.meritPercent || item.meritIncreasePercent || 0,
        meritAmount: item.meritIncreaseAmount || item.meritDollar || 0,
        adjustment: item.adjustmentIncrease || item.adjustmentPercent || 0,
        adjustmentAmount: item.adjustmentIncreaseAmount || item.adjustmentDollar || 0,
        lumpSum: item.lumpSum || item.lumpSumAmount || 0,
        
        // Calculated Fields (Formula-driven - will be recalculated based on formulas)
        totalRaise: item.meritIncreaseAmount || item.totalRaise || 0,
        totalIncrease: item.totalIncreaseAmount || item.totalIncrease || 0,
        finalSalaryRate: item.finalSalaryRate || item.newSalaryRate || item.currentSalary || 0,
        finalSalary: item.finalSalary || item.totalPayIncludingLumpSum || item.newSalary || item.currentSalary || 0,
        
        // Performance & Comments
        performanceRating: item.performanceRating || item.overallPerformanceRating || 0,
        performanceRatingText: item.performanceRatingText || '',
        forceComments: item.forceComments || '',
        managerComments: item.managerComments || item.comments || item.notes || '',
        
        // Bonus Tab Data
        bonusTarget: item.bonusTarget || 0,
        bonusActual: item.bonusActual || 0,
        bonusPercentage: item.bonusPercentage || 0,
        
        // Stock Tab Data
        stockGrant: item.stockGrant || 0,
        stockVested: item.stockVested || 0,
        equityValue: item.equityValue || 0,
        
        // Metadata
        effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
        status: item.status || item.compensationStatus || 'DRAFT',
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

  // GET Workflow Status - Load from saved workflow configuration
  this.on('getWorkflowStatus', async (req) => {
    const { companyId, formId } = req.data;
    
    try {
      // Try to load saved workflow configuration
      let savedWorkflow = null;
      if (this.workflowConfigs && this.workflowConfigs[`${companyId}-${formId}`]) {
        savedWorkflow = this.workflowConfigs[`${companyId}-${formId}`];
      }
      
      // Use saved workflow steps or default structure
      let workflowSteps = savedWorkflow?.steps || [
        {
          stepNumber: 1,
          stepName: "Initiated",
          status: "Completed",
          statusState: "Success",
          assigneeRole: "Initiator",
          icon: "sap-icon://initiative",
          description: "Compensation form created and submitted",
          dueDays: 0,
          required: true
        },
        {
          stepNumber: 2,
          stepName: "Manager Review",
          status: "In Progress",
          statusState: "Warning",
          assigneeRole: "Direct Manager",
          icon: "sap-icon://manager",
          description: "Direct manager reviews and approves compensation",
          dueDays: 3,
          required: true
        },
        {
          stepNumber: 3,
          stepName: "HR Review",
          status: "Pending",
          statusState: "None",
          assigneeRole: "HR Manager",
          icon: "sap-icon://employee",
          description: "HR reviews compensation for compliance",
          dueDays: 2,
          required: true
        },
        {
          stepNumber: 4,
          stepName: "Finance Approval",
          status: "Pending",
          statusState: "None",
          assigneeRole: "Finance Director",
          icon: "sap-icon://money-bills",
          description: "Finance reviews budget and approves",
          dueDays: 3,
          required: true
        },
        {
          stepNumber: 5,
          stepName: "Final Approval",
          status: "Pending",
          statusState: "None",
          assigneeRole: "VP of HR",
          icon: "sap-icon://approvals",
          description: "Senior management final approval",
          dueDays: 5,
          required: false
        },
        {
          stepNumber: 6,
          stepName: "Completed",
          status: "Pending",
          statusState: "None",
          assigneeRole: "System",
          icon: "sap-icon://accept",
          description: "Compensation approved and processed",
          dueDays: 0,
          required: true
        }
      ];
      
      // Enrich steps with real-time data (assignee names, photos, dates)
      const enrichedSteps = workflowSteps.map((step, index) => {
        // Get assignee data based on role
        const assigneeData = getAssigneeByRole(step.assigneeRole, companyId);
        
        return {
          ...step,
          assigneeName: step.assigneeName || assigneeData.name || step.assigneeRole,
          assigneePhoto: step.assigneePhoto || assigneeData.photo || step.icon,
          assigneeId: step.assigneeId || assigneeData.id || "",
          completedDate: step.status === "Completed" ? (step.completedDate || new Date().toLocaleDateString()) : "",
          dueDate: step.dueDate || (step.dueDays > 0 ? new Date(Date.now() + step.dueDays * 24 * 60 * 60 * 1000).toLocaleDateString() : ""),
          comments: step.comments || ""
        };
      });
      
      // Determine overall status
      const completedSteps = enrichedSteps.filter(s => s.status === "Completed").length;
      const inProgressSteps = enrichedSteps.filter(s => s.status === "In Progress").length;
      const currentStep = enrichedSteps.find(s => s.status === "In Progress" || (s.status === "Pending" && !enrichedSteps.slice(0, enrichedSteps.indexOf(s)).some(prev => prev.status === "Pending")));
      
      const workflowStatus = {
        companyId: companyId,
        formId: formId,
        workflowName: savedWorkflow?.workflowName || "Compensation Approval Workflow",
        overallStatus: completedSteps === enrichedSteps.length ? "Completed" : (inProgressSteps > 0 ? "In Progress" : "Pending"),
        statusState: completedSteps === enrichedSteps.length ? "Success" : (inProgressSteps > 0 ? "Warning" : "None"),
        statusIcon: completedSteps === enrichedSteps.length ? "sap-icon://accept" : (inProgressSteps > 0 ? "sap-icon://pending" : "sap-icon://circle-task"),
        currentStep: currentStep ? `Step ${currentStep.stepNumber}: ${currentStep.stepName}` : "Not Started",
        initiatedBy: req.user?.id || savedWorkflow?.lastModifiedBy || "System",
        initiatedDate: savedWorkflow?.lastModified ? new Date(savedWorkflow.lastModified).toLocaleDateString() : new Date().toLocaleDateString(),
        steps: enrichedSteps,
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
  
  // Helper function to get assignee data by role
  function getAssigneeByRole(role, companyId) {
    // Mock assignee data - in real implementation, fetch from SuccessFactors Employee Central
    const assigneeMap = {
      "Initiator": { name: "System User", photo: "https://i.pravatar.cc/150?img=68", id: "system" },
      "Direct Manager": { name: "John Manager", photo: "https://i.pravatar.cc/150?img=69", id: "manager001" },
      "HR Manager": { name: "Sarah HR", photo: "https://i.pravatar.cc/150?img=71", id: "hr001" },
      "Finance Director": { name: "Mike Finance", photo: "https://i.pravatar.cc/150?img=72", id: "finance001" },
      "VP of HR": { name: "Lisa Executive", photo: "https://i.pravatar.cc/150?img=73", id: "exec001" },
      "System": { name: "System", photo: "sap-icon://accept", id: "system" }
    };
    
    return assigneeMap[role] || { name: role, photo: "sap-icon://employee", id: "" };
  }

  // Check User RBP (Role-Based Permissions) - Handler for CDS action
  this.on('checkUserRBP', async (req) => {
    const { companyId, userId, permission } = req.data;
    
    try {
      // Use rbp-service to check permissions
      const rbpResult = await rbpService.checkUserRBP(userId, companyId, permission);
      
      // Return in the format expected by the CDS service definition
      return {
        hasPermission: rbpResult.hasPermission || false,
        userId: userId,
        companyId: companyId,
        permission: permission,
        role: rbpResult.role || "Unknown",
        permissionType: rbpResult.permissionType || "None",
        message: rbpResult.hasPermission 
          ? `User has ${permission} permission` 
          : `User does not have ${permission} permission. Required role: ${rbpResult.role || "Unknown"}`
      };
    } catch (error) {
      console.error("Error checking RBP:", error);
      // Return default deny response on error
      return {
        hasPermission: false,
        userId: userId,
        companyId: companyId,
        permission: permission,
        role: "Unknown",
        permissionType: "Error",
        message: `Failed to verify permissions: ${error.message}`
      };
    }
  });

  // Get Employee Data by RBP - Handler for CDS action
  this.on('getEmployeeDataByRBP', async (req) => {
    const { companyId, userId } = req.data;
    
    try {
      // Use rbp-service to get employee data
      const employeeData = await rbpService.getEmployeeDataByRBP(userId, companyId);
      
      // Transform to match CDS type definition
      return employeeData.map(emp => ({
        employeeId: emp.employeeId || emp.id,
        employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        email: emp.email || "",
        photo: emp.photo || "sap-icon://employee",
        department: emp.department || "",
        jobTitle: emp.jobTitle || "",
        position: emp.position || "",
        managerId: emp.managerId || "",
        managerName: emp.managerName || ""
      }));
    } catch (error) {
      console.error("Error getting employee data by RBP:", error);
      // Return empty array on error
      return [];
    }
  });

  // Get Employee Data from SuccessFactors Employee Central
  this.on('getEmployeeDataFromSF', async (req) => {
    const { companyId, userId, employeeId } = req.data;
    
    try {
      const targetUserId = employeeId || userId;
      
      // 1. Get Personal Information
      const personalEndpoint = `/odata/v2/PerPersonal?$filter=userId eq '${targetUserId}'&$select=personIdExternal,firstName,lastName,email,phoneNumber`;
      const personalData = await callSFAPI(personalEndpoint);
      
      // 2. Get Employment Information
      const employmentEndpoint = `/odata/v2/EmpEmployment?$filter=userId eq '${targetUserId}'&$select=startDate,jobTitle,department,position`;
      const employmentData = await callSFAPI(employmentEndpoint);
      
      // 3. Get Job Information
      const jobEndpoint = `/odata/v2/EmpJob?$filter=userId eq '${targetUserId}'&$select=jobTitle,department,position,managerId`;
      const jobData = await callSFAPI(jobEndpoint);
      
      // 4. Get Employee Photo
      const photoEndpoint = `/odata/v2/Photo?$filter=userId eq '${targetUserId}'`;
      let photoUrl = null;
      try {
        const photoData = await callSFAPI(photoEndpoint);
        photoUrl = photoData.d?.results?.[0]?.photo || null;
      } catch (error) {
        console.log("Photo not available for user:", targetUserId);
      }
      
      // 5. Combine all data
      const employeeData = {
        employeeId: personalData.d?.results?.[0]?.personIdExternal || targetUserId,
        firstName: personalData.d?.results?.[0]?.firstName || "",
        lastName: personalData.d?.results?.[0]?.lastName || "",
        email: personalData.d?.results?.[0]?.email || "",
        phoneNumber: personalData.d?.results?.[0]?.phoneNumber || "",
        jobTitle: jobData.d?.results?.[0]?.jobTitle || employmentData.d?.results?.[0]?.jobTitle || "",
        department: jobData.d?.results?.[0]?.department || employmentData.d?.results?.[0]?.department || "",
        position: jobData.d?.results?.[0]?.position || employmentData.d?.results?.[0]?.position || "",
        managerId: jobData.d?.results?.[0]?.managerId || "",
        startDate: employmentData.d?.results?.[0]?.startDate || "",
        photo: photoUrl || "sap-icon://employee",
        employeeName: `${personalData.d?.results?.[0]?.firstName || ''} ${personalData.d?.results?.[0]?.lastName || ''}`.trim()
      };
      
      return employeeData;
    } catch (error) {
      req.error(500, `Failed to extract employee data from SuccessFactors: ${error.message}`);
    }
  });

  // Save to SuccessFactors MDF Object
  this.on('saveToMDFObject', async (req) => {
    const { companyId, data } = req.data;
    
    try {
      // SuccessFactors MDF API endpoint (adjust object name based on your MDF configuration)
      const mdfObjectName = 'CompensationExtension'; // Change to your MDF object name
      const mdfEndpoint = `/odata/v2/${mdfObjectName}`;
      
      // Check if record exists
      const checkEndpoint = `/odata/v2/${mdfObjectName}?$filter=employeeId eq '${data.employeeId}' and formId eq '${data.formId}'`;
      const existing = await callSFAPI(checkEndpoint);
      
      if (existing.d?.results?.length > 0) {
        // UPDATE existing MDF record
        const updateEndpoint = `/odata/v2/${mdfObjectName}('${existing.d.results[0].id}')`;
        const mdfPayload = {
          employeeId: data.employeeId,
          formId: data.formId,
          meritIncrease: data.meritIncrease,
          finalSalary: data.finalSalary,
          status: data.status || 'Draft',
          lastModified: new Date().toISOString()
        };
        
        await callSFAPI(updateEndpoint, 'PATCH', mdfPayload);
        return { success: true, action: 'UPDATED', id: existing.d.results[0].id };
      } else {
        // CREATE new MDF record
        const mdfPayload = {
          employeeId: data.employeeId,
          formId: data.formId,
          meritIncrease: data.meritIncrease || 0,
          finalSalary: data.finalSalary || 0,
          status: data.status || 'Draft',
          lastModified: new Date().toISOString()
        };
        
        const result = await callSFAPI(mdfEndpoint, 'POST', mdfPayload);
        return { success: true, action: 'CREATED', id: result.d?.id };
      }
    } catch (error) {
      console.error('Error saving to MDF object:', error);
      // Don't fail the request if MDF save fails
      return { success: false, message: error.message };
    }
  });

  // Get from SuccessFactors MDF Object
  this.on('getFromMDFObject', async (req) => {
    const { companyId, employeeId, formId } = req.data;
    
    try {
      const mdfObjectName = 'CompensationExtension';
      const endpoint = `/odata/v2/${mdfObjectName}?$filter=employeeId eq '${employeeId}' and formId eq '${formId}'`;
      const mdfData = await callSFAPI(endpoint);
      
      if (mdfData.d?.results?.length > 0) {
        return mdfData.d.results[0];
      }
      
      return null;
    } catch (error) {
      req.error(500, `Failed to get from MDF object: ${error.message}`);
    }
  });

  // Audit Logging Function
  this.on('logAudit', async (req) => {
    const { companyId, userId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent, changes } = req.data;
    
    try {
      await cds.run(
        INSERT.into('com.sap.sf.compensation.AuditLog').entries({
          id: cds.utils.uuid(),
          companyId: companyId,
          userId: userId,
          action: action,
          entityType: entityType,
          entityId: entityId,
          oldValue: oldValue || '',
          newValue: newValue || '',
          timestamp: new Date().toISOString(),
          ipAddress: ipAddress || req._?.req?.ip || '',
          userAgent: userAgent || req._?.req?.headers?.['user-agent'] || '',
          sessionId: req._?.req?.sessionID || '',
          changes: changes || ''
        })
      );
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  });

  // Get Audit Logs
  this.on('getAuditLogs', async (req) => {
    const { companyId, userId, entityType, entityId, startDate, endDate } = req.data;
    
    try {
      let query = SELECT.from('com.sap.sf.compensation.AuditLog');
      const conditions = [];
      
      if (companyId) conditions.push({ companyId: companyId });
      if (userId) conditions.push({ userId: userId });
      if (entityType) conditions.push({ entityType: entityType });
      if (entityId) conditions.push({ entityId: entityId });
      if (startDate) conditions.push({ timestamp: { '>=': startDate } });
      if (endDate) conditions.push({ timestamp: { '<=': endDate } });
      
      if (conditions.length > 0) {
        query = query.where(conditions.reduce((acc, cond) => ({ ...acc, ...cond }), {}));
      }
      
      query = query.orderBy({ timestamp: 'desc' });
      
      const auditLogs = await cds.run(query);
      return auditLogs;
    } catch (error) {
      req.error(500, `Failed to get audit logs: ${error.message}`);
    }
  });

  // Generate Report
  this.on('generateReport', async (req) => {
    const { companyId, formId, reportType, startDate, endDate } = req.data;
    
    try {
      let reportData = {};
      
      if (reportType === 'Summary') {
        // Summary Report
        const summary = await cds.run(
          SELECT.from(CompensationWorksheet)
            .columns('SUM(finalSalary) as totalSalary', 'COUNT(*) as employeeCount', 'AVG(meritIncrease) as avgMeritIncrease')
            .where({ companyId: companyId, formId: formId })
        );
        
        reportData = {
          type: 'Summary',
          totalSalary: summary[0]?.totalSalary || 0,
          employeeCount: summary[0]?.employeeCount || 0,
          avgMeritIncrease: summary[0]?.avgMeritIncrease || 0,
          generatedAt: new Date().toISOString()
        };
      } else if (reportType === 'Detail') {
        // Detail Report
        const details = await cds.run(
          SELECT.from(CompensationWorksheet)
            .where({ companyId: companyId, formId: formId })
        );
        
        reportData = {
          type: 'Detail',
          records: details,
          count: details.length,
          generatedAt: new Date().toISOString()
        };
      } else if (reportType === 'Compliance') {
        // Compliance Report - Audit Logs
        const compliance = await cds.run(
          SELECT.from('com.sap.sf.compensation.AuditLog')
            .where({ 
              companyId: companyId,
              action: { 'in': ['CREATE', 'UPDATE', 'DELETE'] }
            })
            .orderBy({ timestamp: 'desc' })
        );
        
        reportData = {
          type: 'Compliance',
          auditLogs: compliance,
          count: compliance.length,
          generatedAt: new Date().toISOString()
        };
      }
      
      // Save report
      const reportId = cds.utils.uuid();
      await cds.run(
        INSERT.into('com.sap.sf.compensation.CompensationReport').entries({
          id: reportId,
          reportName: `${reportType} Report - ${formId || 'All'}`,
          reportType: reportType,
          companyId: companyId,
          formId: formId || '',
          generatedBy: req.user?.id || 'System',
          generatedAt: new Date().toISOString(),
          reportData: JSON.stringify(reportData),
          status: 'Generated',
          exportFormat: 'JSON'
        })
      );
      
      return {
        reportId: reportId,
        reportData: reportData
      };
    } catch (error) {
      req.error(500, `Failed to generate report: ${error.message}`);
    }
  });

  // Export Report
  this.on('exportReport', async (req) => {
    const { reportId, format } = req.data;
    
    try {
      const report = await cds.run(
        SELECT.one.from('com.sap.sf.compensation.CompensationReport').where({ id: reportId })
      );
      
      if (!report) {
        req.error(404, 'Report not found');
        return;
      }
      
      const reportData = JSON.parse(report.reportData);
      
      if (format === 'CSV') {
        // Convert to CSV format
        const csv = convertToCSV(reportData);
        return {
          format: 'CSV',
          data: csv,
          filename: `${report.reportName}.csv`
        };
      }
      
      return {
        format: format || 'JSON',
        data: reportData,
        filename: `${report.reportName}.${format?.toLowerCase() || 'json'}`
      };
    } catch (error) {
      req.error(500, `Failed to export report: ${error.message}`);
    }
  });

  // Helper function to convert to CSV
  function convertToCSV(data) {
    if (data.type === 'Detail' && data.records) {
      const headers = Object.keys(data.records[0] || {});
      const csvRows = [headers.join(',')];
      
      data.records.forEach(record => {
        const values = headers.map(header => {
          const value = record[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }
    return JSON.stringify(data);
  }

  // Enhanced POST handler - Save to both DB and MDF
  this.before('CREATE', CompensationWorksheet, async (req) => {
    req.data.id = req.data.id || cds.utils.uuid();
    req.data.lastModified = new Date().toISOString();
    req.data.lastModifiedBy = req.data.userId || req.user?.id || 'System';
  });

  this.after('CREATE', CompensationWorksheet, async (data, req) => {
    try {
      // 1. Save to SuccessFactors MDF Object
      await this.on('saveToMDFObject', {
        data: {
          companyId: data.companyId,
          data: data
        }
      });
      
      // 2. Log audit trail
      await this.on('logAudit', {
        data: {
          companyId: data.companyId,
          userId: req.user?.id || data.userId,
          action: 'CREATE',
          entityType: 'Compensation',
          entityId: data.id,
          newValue: JSON.stringify(data),
          timestamp: new Date().toISOString(),
          ipAddress: req._?.req?.ip,
          userAgent: req._?.req?.headers?.['user-agent']
        }
      });
    } catch (error) {
      console.error('Error in after CREATE:', error);
    }
  });

  this.before('UPDATE', CompensationWorksheet, async (req) => {
    // Get old value before update
    try {
      const oldRecord = await cds.run(
        SELECT.one.from(CompensationWorksheet).where({ id: req.data.id })
      );
      req._oldValue = oldRecord;
    } catch (error) {
      console.error('Error getting old value:', error);
    }
    req.data.lastModified = new Date().toISOString();
    req.data.lastModifiedBy = req.data.userId || req.user?.id || 'System';
  });

  this.after('UPDATE', CompensationWorksheet, async (data, req) => {
    try {
      // 1. Save to SuccessFactors MDF Object
      await this.on('saveToMDFObject', {
        data: {
          companyId: data.companyId,
          data: data
        }
      });
      
      // 2. Log audit trail with changes
      const oldValue = req._oldValue;
      const changes = {};
      
      if (oldValue) {
        Object.keys(data).forEach(key => {
          if (oldValue[key] !== data[key]) {
            changes[key] = {
              old: oldValue[key],
              new: data[key]
            };
          }
        });
      }
      
      await this.on('logAudit', {
        data: {
          companyId: data.companyId,
          userId: req.user?.id || data.userId,
          action: 'UPDATE',
          entityType: 'Compensation',
          entityId: data.id,
          oldValue: JSON.stringify(oldValue),
          newValue: JSON.stringify(data),
          changes: JSON.stringify(changes),
          timestamp: new Date().toISOString(),
          ipAddress: req._?.req?.ip,
          userAgent: req._?.req?.headers?.['user-agent']
        }
      });
    } catch (error) {
      console.error('Error in after UPDATE:', error);
    }
  });

  // Save Workflow Configuration
  this.on('saveWorkflow', async (req) => {
    const { companyId, formId, workflow } = req.data;
    
    try {
      // In a real implementation, this would save to database
      // For now, we'll store it in memory and could sync to SuccessFactors
      console.log('Saving workflow configuration:', {
        companyId,
        formId,
        workflowName: workflow.workflowName,
        stepsCount: workflow.steps?.length || 0
      });
      
      // TODO: Save to database or SuccessFactors
      // You can add database persistence here
      
      // Return saved workflow
      return {
        companyId: companyId,
        formId: formId,
        workflowName: workflow.workflowName,
        description: workflow.description,
        steps: workflow.steps || [],
        savedAt: new Date().toISOString(),
        savedBy: req.user?.id || 'system'
      };
    } catch (error) {
      req.error(500, `Failed to save workflow: ${error.message}`);
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
