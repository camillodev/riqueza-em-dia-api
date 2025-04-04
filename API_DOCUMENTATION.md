# Riqueza em Dia API Documentation

This document serves as a comprehensive guide for frontend developers integrating with the Riqueza em Dia API. All monetary values in the API are represented in cents (integer values) to avoid floating-point precision issues.

## Base URL

```
https://api.riquezaemdia.com/api
```

For local development:

```
http://localhost:3000/api
```

## Authentication

All API requests (except authentication endpoints) require a valid JWT token.

### Headers

Include the following header in all authenticated requests:

```
Authorization: Bearer {your_jwt_token}
```

## API Endpoints

### Authentication

#### Register User (handled by Clerk)

User registration is handled by Clerk. After successful registration with Clerk, the user will be automatically created in our database via webhooks.

#### Current User

```
GET /users/current
```

**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "clerkId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### Update User

```
PUT /users/update
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:** Updated user object

### Accounts

#### List All Accounts

```
GET /accounts
```

**Query Parameters:**
- `includeArchived` (boolean, optional): Whether to include archived accounts

**Response:**

```json
[
  {
    "id": "string",
    "name": "string",
    "type": "string",
    "balance": number,
    "color": "string",
    "icon": "string",
    "isArchived": boolean,
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

#### Get Account Summary

```
GET /accounts/summary
```

**Response:**

```json
{
  "totalBalance": number,
  "accountsCount": number,
  "accounts": [
    {
      "id": "string",
      "name": "string",
      "balance": number,
      "color": "string"
    }
  ]
}
```

#### Get Account by ID

```
GET /accounts/:id
```

**Response:** Account object

#### Create Account

```
POST /accounts
```

**Request Body:**

```json
{
  "name": "string",
  "type": "string",
  "balance": number,
  "color": "string",
  "icon": "string"
}
```

**Response:** Created account object

#### Update Account

```
PUT /accounts/:id
```

**Request Body:**

```json
{
  "name": "string",
  "type": "string",
  "balance": number,
  "color": "string",
  "icon": "string"
}
```

**Response:** Updated account object

#### Delete Account

```
DELETE /accounts/:id
```

**Response:** Success message

#### Archive Account

```
PUT /accounts/:id/archive
```

**Request Body:**

```json
{
  "isArchived": boolean
}
```

**Response:** Updated account object

### Transactions

#### List Transactions

```
GET /transactions
```

**Query Parameters:**
- `accountId` (string, optional): Filter by account ID
- `type` (string, optional): Filter by transaction type (income/expense)
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `startDate` (string, optional): Start date filter (YYYY-MM-DD)
- `endDate` (string, optional): End date filter (YYYY-MM-DD)
- `categoryId` (string, optional): Filter by category ID
- `status` (string, optional): Filter by status (pending/completed/canceled)

**Response:**

```json
{
  "items": [
    {
      "id": "string",
      "amount": number,
      "description": "string",
      "date": "string",
      "type": "income|expense",
      "status": "pending|completed|canceled",
      "accountId": "string",
      "account": {
        "id": "string",
        "name": "string"
      },
      "categoryId": "string",
      "category": {
        "id": "string",
        "name": "string",
        "icon": "string",
        "color": "string"
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": {
    "currentPage": number,
    "itemsPerPage": number,
    "totalItems": number,
    "totalPages": number
  }
}
```

#### Get Transaction by ID

```
GET /transactions/:id
```

**Response:** Transaction object

#### Create Transaction

```
POST /transactions
```

**Request Body:**

```json
{
  "amount": number,
  "description": "string",
  "date": "string",
  "type": "income|expense",
  "status": "pending|completed|canceled",
  "accountId": "string",
  "categoryId": "string"
}
```

**Response:** Created transaction object

#### Update Transaction

```
PUT /transactions/:id
```

**Request Body:**

```json
{
  "amount": number,
  "description": "string",
  "date": "string",
  "type": "income|expense",
  "status": "pending|completed|canceled",
  "accountId": "string",
  "categoryId": "string"
}
```

**Response:** Updated transaction object

#### Delete Transaction

```
DELETE /transactions/:id
```

**Response:** Success message

### Reports

#### Get Financial Summary

```
GET /reports/summary
```

**Query Parameters:**
- `month` (string, optional): Month in format YYYY-MM (defaults to current month)

**Response:**

```json
{
  "totalBalance": number,
  "monthlyIncome": number,
  "monthlyExpense": number,
  "recentTransactions": [
    {
      "id": "string",
      "amount": number,
      "description": "string",
      "date": "string",
      "category": "string",
      "type": "income|expense",
      "account": "string"
    }
  ]
}
```

#### Get Income vs Expense Chart Data

```
GET /reports/charts/income-vs-expense
```

**Query Parameters:**
- `month` (string, optional): Month in format YYYY-MM (defaults to current month)

**Response:**

```json
[
  { 
    "name": "Receitas",
    "value": number,
    "color": "string"
  },
  {
    "name": "Despesas",
    "value": number,
    "color": "string"
  }
]
```

#### Get Transactions by Category Chart Data

```
GET /reports/charts/by-category
```

**Query Parameters:**
- `month` (string, optional): Month in format YYYY-MM (defaults to current month)
- `type` (string, required): Transaction type (income/expense)

**Response:**

```json
[
  {
    "name": "string",
    "value": number,
    "color": "string"
  }
]
```

#### Get Monthly Data for Time Series Chart

```
GET /reports/charts/monthly-data
```

**Query Parameters:**
- `month` (string, optional): End month in format YYYY-MM (defaults to current month)
- `days` (number, optional): Group by days

**Response:**

```json
[
  {
    "month": "string",
    "income": number,
    "expense": number,
    "balance": number
  }
]
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error objects:

```json
{
  "statusCode": number,
  "message": "string",
  "error": "string"
}
```

Common status codes:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server-side issue

## Data Types

### Account Types
- `checking`: Checking Account
- `savings`: Savings Account
- `credit`: Credit Card
- `investment`: Investment Account
- `cash`: Cash
- `other`: Other Account Types

### Transaction Types
- `income`: Money received
- `expense`: Money spent

### Transaction Status
- `pending`: Transaction is pending
- `completed`: Transaction is completed
- `canceled`: Transaction is canceled

## Pagination

Endpoints that return lists support pagination with the following pattern:

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response Meta:**
```json
{
  "meta": {
    "currentPage": number,
    "itemsPerPage": number,
    "totalItems": number,
    "totalPages": number
  }
}
```

## Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:
- 100 requests per minute per IP address
- 1000 requests per hour per user

When rate limited, the API will respond with a `429 Too Many Requests` status code.

## Notes for Frontend Implementation

1. **Currency Handling**:
   - All monetary values are in cents (integers)
   - Example: R$ 10.99 is represented as 1099
   - Convert to display format on the frontend

2. **Dates**:
   - All dates use ISO 8601 format (YYYY-MM-DD)
   - Date filtering uses this format

3. **Error Handling**:
   - Implement proper error handling for all API calls
   - Display user-friendly error messages
   - Implement retry logic for network failures

4. **Performance**:
   - The reports endpoints include caching for better performance
   - Consider implementing client-side caching for frequently accessed data

5. **Authentication**:
   - JWT tokens expire after 24 hours
   - Implement refresh token logic to maintain user sessions 