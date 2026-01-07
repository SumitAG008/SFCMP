const axios = require('axios');
const xsenv = require('@sap/xsenv');

/**
 * SuccessFactors RBP (Role-Based Permissions) Service
 * Checks user permissions and controls access
 */

// Get SuccessFactors credentials
let sfCredentials;
try {
  sfCredentials = xsenv.getServices({ SuccessFactors: { tag: 'successfactors' } }).SuccessFactors;
} catch (e) {
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

// Check user RBP permissions
async function checkUserRBP(userId, companyId, permission) {
  try {
    const authHeader = await getAuthHeader();
    
    // Call SuccessFactors RBP API
    // API: /odata/v2/UserPermissionNav?$filter=userId eq 'userId' and permission eq 'permission'
    const endpoint = `/odata/v2/UserPermissionNav?$filter=userId eq '${userId}' and companyId eq '${companyId}' and permission eq '${permission}'`;
    
    const response = await axios.get(`${sfCredentials.url}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Check if user has permission
    if (response.data && response.data.d && response.data.d.results && response.data.d.results.length > 0) {
      return {
        hasPermission: true,
        permission: response.data.d.results[0],
        role: response.data.d.results[0].role,
        permissionType: response.data.d.results[0].permissionType
      };
    }

    return {
      hasPermission: false,
      role: null,
      permissionType: null
    };
  } catch (error) {
    console.error('Error checking RBP:', error.message);
    // Fallback: check user roles
    return await checkUserRoles(userId, companyId);
  }
}

// Check user roles (fallback method)
async function checkUserRoles(userId, companyId) {
  try {
    const authHeader = await getAuthHeader();
    
    // Call SuccessFactors User API to get roles
    const endpoint = `/odata/v2/User?$filter=userId eq '${userId}' and companyId eq '${companyId}'&$select=userId,role,permission`;
    
    const response = await axios.get(`${sfCredentials.url}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.d && response.data.d.results && response.data.d.results.length > 0) {
      const user = response.data.d.results[0];
      const roles = user.role || [];
      
      // Check for compensation-related roles
      const compensationRoles = [
        'COMPENSATION_ADMIN',
        'COMPENSATION_MANAGER',
        'COMPENSATION_USER',
        'HR_ADMIN',
        'HR_MANAGER'
      ];
      
      const hasCompensationAccess = roles.some(role => compensationRoles.includes(role));
      
      return {
        hasPermission: hasCompensationAccess,
        role: roles,
        permissionType: hasCompensationAccess ? 'COMPENSATION_ACCESS' : 'NONE'
      };
    }

    return {
      hasPermission: false,
      role: [],
      permissionType: 'NONE'
    };
  } catch (error) {
    console.error('Error checking user roles:', error.message);
    // Default: allow access (for development)
    return {
      hasPermission: true,
      role: ['DEFAULT'],
      permissionType: 'DEFAULT_ACCESS'
    };
  }
}

// Get employee data for user based on RBP
async function getEmployeeDataByRBP(userId, companyId) {
  try {
    const authHeader = await getAuthHeader();
    
    // First check user permissions
    const rbpCheck = await checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
    
    if (!rbpCheck.hasPermission) {
      throw new Error('User does not have permission to view compensation data');
    }

    // Get user's direct reports or accessible employees based on RBP
    // API: /odata/v2/Employee?$filter=managerId eq 'userId' or userId eq 'userId'
    const endpoint = `/odata/v2/Employee?$filter=companyId eq '${companyId}' and (managerId eq '${userId}' or userId eq '${userId}')&$select=userId,firstName,lastName,email,photo,department,jobTitle,position`;
    
    const response = await axios.get(`${sfCredentials.url}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.d && response.data.d.results) {
      return response.data.d.results.map(emp => ({
        employeeId: emp.userId,
        employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        photo: emp.photo || `sap-icon://employee`,
        department: emp.department,
        jobTitle: emp.jobTitle || emp.position,
        position: emp.position || emp.jobTitle
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting employee data by RBP:', error.message);
    throw error;
  }
}

// Check if user can edit compensation
async function canUserEditCompensation(userId, companyId, employeeId) {
  try {
    // Check edit permission
    const editPermission = await checkUserRBP(userId, companyId, 'COMPENSATION_EDIT');
    
    if (!editPermission.hasPermission) {
      return false;
    }

    // If user is manager of the employee, allow edit
    const authHeader = await getAuthHeader();
    const endpoint = `/odata/v2/Employee?$filter=userId eq '${employeeId}' and managerId eq '${userId}' and companyId eq '${companyId}'`;
    
    const response = await axios.get(`${sfCredentials.url}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.d && response.data.d.results && response.data.d.results.length > 0) {
      return true; // User is manager of this employee
    }

    // Check if user has admin role
    const roles = editPermission.role || [];
    const adminRoles = ['COMPENSATION_ADMIN', 'HR_ADMIN'];
    return roles.some(role => adminRoles.includes(role));
  } catch (error) {
    console.error('Error checking edit permission:', error.message);
    return false;
  }
}

module.exports = {
  checkUserRBP,
  checkUserRoles,
  getEmployeeDataByRBP,
  canUserEditCompensation
};
