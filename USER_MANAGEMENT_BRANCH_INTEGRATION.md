# User Management Branch Dropdown Integration

## Summary

Added branch selection dropdown functionality to the User Management component, replacing the manual branch ID text input with a user-friendly dropdown that shows branch names, codes, and regions.

## Changes Made

### 1. **Added Branch State and API Integration**
- Added `branches` state to store available branches
- Added `fetchBranches()` function using the existing `branchApiService`
- Updated `useEffect` to fetch both users and branches on component mount

### 2. **Enhanced Branch Display**
- Added `getBranchName()` helper function to display branch name and code instead of just ID
- Updated the users table to show meaningful branch information
- Handles cases where branch data is null, undefined, or not found

### 3. **Replaced Text Inputs with Dropdowns**
- **Create User Modal**: Replaced "Branch ID (Optional)" text input with a branch selection dropdown
- **Edit User Modal**: Replaced "Branch ID (Optional)" text input with a branch selection dropdown
- Both dropdowns show: `Branch Name (Branch Code) - Region`
- Added helpful text explaining when to leave branch empty

### 4. **Added Branch Filtering**
- Extended filters state to include branch filtering
- Added branch dropdown to the filters section
- Updated filter logic to support filtering users by branch
- Shows "All Branches" option to clear the filter

### 5. **Improved User Experience**
- Dropdowns show human-readable branch information instead of numeric IDs
- Clear indication of optional vs required fields
- Consistent styling with existing form elements
- Proper handling of edge cases (no branch assigned, branch not found)

## Technical Details

### New Dependencies
- Imports `branchApiService` and `BranchResponseDto` from `../services/branch-api`

### Branch Dropdown Options Format
```
Branch Name (Branch Code) - Region
Example: "Downtown Branch (BR001) - Central"
```

### Filter Integration
- Added `branch` to filters state object
- Branch filter works alongside existing role and status filters
- Users can filter by specific branch or view all branches

### Error Handling
- Branch API errors are logged but don't block user management functionality
- Graceful fallback when branch data is unavailable
- Type-safe handling of optional branch IDs

## Benefits

1. **User-Friendly**: No more manual branch ID entry - users select from a dropdown
2. **Data Integrity**: Prevents invalid branch ID entries
3. **Better UX**: Shows meaningful branch names instead of numeric IDs
4. **Consistent**: Matches the pattern used in BranchManagement component
5. **Efficient**: Users can quickly filter and assign branches
6. **Scalable**: Automatically updates when new branches are added

## Usage

### Creating a User
1. Fill in user details (name, email, password, role)
2. Optionally select a branch from the dropdown
3. Leave branch empty for admin roles that don't require branch assignment

### Editing a User
1. Edit user details as needed
2. Change branch assignment using the dropdown
3. Can remove branch assignment by selecting the empty option

### Filtering Users
1. Use the "All Branches" dropdown in the filters section
2. Select a specific branch to see only users assigned to that branch
3. Combine with role and status filters for precise filtering

The integration maintains backward compatibility while significantly improving the user experience for branch management in the user administration interface.
