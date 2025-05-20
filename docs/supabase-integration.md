# Supabase Integration for CS2 Analytics Platform

This document explains how to use the Supabase integration for the CS2 Analytics Platform, which allows you to transition from CSV-based data to a Supabase PostgreSQL database.

## Overview

The Supabase integration provides:

1. Connection to Supabase PostgreSQL database
2. Adapter pattern to transform database data to application models
3. Automatic daily data refresh mechanism
4. Fallback to CSV files if database connection fails
5. Seamless integration with existing analytics functions

## Configuration

### Database Setup

1. Make sure your Supabase project is created and properly configured
2. The connection URL should be available as an environment variable named `DATABASE_URL`
3. The system will automatically test the connection and fall back to CSV if needed

### Switching Between Data Sources

To use Supabase as your primary data source:

1. Make sure the `DATABASE_URL` environment variable is set correctly
2. Use the updated application entry point: `server/index-with-supabase.ts`

To use the original CSV-based implementation:

1. Continue using the existing application entry point: `server/index.ts`

## Implementation Details

### Data Refresh Mechanism

The Supabase integration includes a data refresh manager that:

- Refreshes data automatically every 24 hours
- Performs an initial refresh on application startup
- Can be manually triggered when needed
- Handles connection errors with proper fallback strategies

### SupabaseAdapter

The adapter pattern transforms Supabase database schema into the application's data models:

- `SupaPlayerData` → `PlayerRawStats`
- Database JOIN operations to combine player data from multiple tables
- Proper handling of missing or null data

### SupabaseStorage

This class implements the `IStorage` interface and provides:

- Methods to get and set player and team data
- Support for role-based filtering and team evaluation
- Caching mechanism to improve performance
- Fallback to CSV data sources when needed

## Role Data

The role information (CT roles, T roles, IGL) currently comes from CSV files but can be moved to Supabase. This allows for a gradual transition of data to the database while maintaining all functionality.

## Using the Data Refresh Manager

```typescript
import { dataRefreshManager } from './dataRefreshManager';

// Start the refresh manager (automatically refreshes data)
await dataRefreshManager.start();

// Manually trigger a refresh
await dataRefreshManager.refreshData();

// Check last refresh time
const lastRefresh = dataRefreshManager.getLastRefreshTime();

// Change refresh interval (in milliseconds)
dataRefreshManager.setRefreshInterval(12 * 60 * 60 * 1000); // 12 hours

// Check if Supabase is available
const isAvailable = dataRefreshManager.isSupabaseAvailable();

// Stop the refresh manager (when shutting down)
dataRefreshManager.stop();
```

## Error Handling

The integration includes comprehensive error handling:

- Connection errors are caught and logged
- Failed queries trigger appropriate fallback mechanisms
- Data transformation errors are properly handled
- Missing or null values have appropriate defaults

## Future Enhancements

Potential enhancements for the future:

1. Store role information directly in Supabase
2. Add admin interfaces to manage/update data
3. Implement data versioning for historical analysis
4. Add authentication/authorization for data access
5. Implement real-time updates using Supabase Realtime