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

export interface ClientDocument {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  uploadedAt: string
}

export interface ClientClaim {
  id: string
  claimNumber: string
  status: string
  incidentDate: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  idNumber?: string
  consentRecords?: ConsentRecord[]
  policies?: Policy[]
  claims?: ClientClaim[]
  documents?: ClientDocument[]
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
  totpCode?: string
}

export interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  mfaRequired?: boolean
  requiresMfa?: boolean
  userId?: string
  tempToken?: string
}

export interface Claim {
  id: string
  claimNumber: string
  status: string
  incidentDate: string
  reportedDate: string
  description?: string
  policyId: string
  clientId: string
  policy?: { policyNumber: string }
  client?: { firstName: string; lastName: string }
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
