# Branch Management Integration

This document explains how the Branch Management component has been integrated with the backend API.

## Backend Integration

### API Endpoints Used

1. **GET /api/branches** - Fetch all branches
2. **GET /api/branches/{id}** - Fetch branch by ID
3. **POST /api/branches** - Create new branch
4. **PUT /api/branches/{id}** - Update existing branch
5. **DELETE /api/branches/{id}** - Delete branch
6. **GET /api/branches/regions** - Get distinct regions
7. **GET /api/branches/search?q={searchTerm}** - Search branches

### Data Transfer Objects (DTOs)

#### BranchCreateDto
```typescript
{
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;        // Required for INTERNATIONAL type
  country?: string;      // Required for INTERNATIONAL type
}
```

#### BranchUpdateDto
```typescript
{
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
  isActive?: boolean;
}
```

#### BranchResponseDto
```typescript
{
  id: number;
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: any[];         // Related users
  manager?: any;         // Branch manager
  userCount: number;     // Total users in branch
  managerCount: number;  // Number of managers
}
```

## Changes Made

### 1. Updated Component Structure
- Removed `managerId` field from create/edit forms (not supported by backend)
- Added proper error handling with user-friendly messages
- Updated type definitions to match backend enums (`DOMESTIC`/`INTERNATIONAL`)
- Added loading states and error alerts

### 2. API Service Layer
- Created `services/branch-api.ts` for centralized API calls
- Uses axios interceptors for authentication and error handling
- Provides typed interfaces matching backend DTOs

### 3. Authentication Integration
- Uses existing `axiosInstance.ts` for HTTP requests
- Automatic token refresh on 401 errors
- Proper error propagation to UI components

### 4. User Role Integration
- Only `SUPER_ADMIN` role can access branch management
- Proper role-based access control as per backend

## Usage

The component now:
1. Fetches branches from real backend API
2. Creates new branches with proper validation
3. Updates existing branches (excluding manager assignment)
4. Shows proper error messages from backend
5. Handles loading states appropriately

## Error Handling

The component handles various error scenarios:
- Network errors
- Validation errors from backend
- Authentication errors (redirects to login)
- General server errors

## Future Enhancements

1. Add manager assignment functionality when backend supports it
2. Implement branch deletion (currently supported by backend)
3. Add pagination for large branch lists
4. Implement branch activity tracking
5. Add branch status management (active/inactive)

## Backend Compatibility

The component is now fully compatible with the Spring Boot backend:
- Matches exact DTO structures
- Uses correct HTTP methods and endpoints
- Handles backend validation responses
- Supports both domestic and international branch types
