export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  organisationId: string
  branchId?: string
  roles: Role[]
  permissions: string[]
}

export interface Role {
  id: string
  name: string
}

export interface ConsentRecord {
  id: string
  purpose: string
  granted: boolean
  createdAt: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  idNumber?: string
  consentRecords?: ConsentRecord[]
  organisationId: string
  branchId?: string
  createdAt: string
  updatedAt: string
}

export interface Policy {
  id: string
  clientId: string
  client?: { firstName: string; lastName: string }
  policyNumber: string
  lineOfBusiness: string
  status: string
  inceptionDate: string
  expiryDate: string
  sumInsured?: string
  premium?: string
  riskAddressLine1?: string
  riskCity?: string
  riskProvince?: string
  riskPostalCode?: string
  organisationId: string
  branchId?: string
  createdAt: string
}

export interface PolicyOption {
  id: string
  clientName: string
  display: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  requiresMfa: boolean
  tempToken?: string
}

export interface MfaInput {
  code: string
}

export interface MfaResponse {
  accessToken: string
  refreshToken: string
}

export interface IntakeRequest {
  message: string
}

export interface IntakeResponse {
  summary: string
  activityCode: string
  priority: string
  missingInfo: string[]
  responsibleDepartment: string
  suggestedTasks: string[]
  draftResponse: string
  complianceFlags: string[]
}
