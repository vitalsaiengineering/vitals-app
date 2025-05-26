# Orion AUM History Optimization

## Overview

The `orion_aum_history` table has been optimized to handle large volumes of AUM (Assets Under Management) data from the Orion API with fast retrieval capabilities.

## Data Format

The table is designed to store data in this format from the Orion API:

```json
[
    {
        "id": 17,
        "grouping": 5,
        "asOfDate": "2008-06-18",
        "value": 0
    },
    {
        "id": 17,
        "grouping": 5,
        "asOfDate": "2008-06-21",
        "value": 262824.47
    }
]
```

## Optimized Table Structure

```sql
CREATE TABLE orion_aum_history (
    internal_id BIGSERIAL PRIMARY KEY,
    orion_entity_id INTEGER NOT NULL,
    grouping INTEGER NOT NULL,
    as_of_date DATE NOT NULL,
    value DECIMAL(20,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(orion_entity_id, grouping, as_of_date, firm_integration_config_id)
);
```

## Performance Optimizations

### 1. Strategic Indexing

- **Primary lookup**: `idx_orion_aum_entity_date` - Fast entity + date range queries
- **Grouping queries**: `idx_orion_aum_grouping_date` - Efficient grouping-based lookups
- **Date ranges**: `idx_orion_aum_date_only` - Time series analysis
- **Composite**: `idx_orion_aum_entity_grouping_date` - Complex multi-field queries
- **Value-based**: `idx_orion_aum_value` - Threshold queries (partial index for non-zero values)
- **Recent data**: `idx_orion_aum_recent` - Partial index for last 2 years (most accessed data)

### 2. Bulk Insert Function

```sql
SELECT insert_orion_aum_batch(jsonb_data, firm_integration_config_id);
```

- Handles batch inserts efficiently
- Automatic upsert logic (INSERT ... ON CONFLICT DO UPDATE)
- Returns count of processed records

### 3. Time Series Query Function

```sql
SELECT * FROM get_orion_aum_time_series(
    entity_id, 
    grouping, 
    start_date, 
    end_date, 
    firm_config_id
);
```

- Optimized for time series data retrieval
- Flexible parameter filtering
- Ordered by date (DESC) for recent-first access

## API Endpoints

### Store AUM History Data
```
POST /api/orion/sync-aum-history
```

**Request Body:**
```json
{
    "aumData": [
        {
            "id": 17,
            "grouping": 5,
            "asOfDate": "2008-06-18",
            "value": 0
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "inserted": 1,
    "message": "Successfully stored 1 AUM history records"
}
```

### Retrieve Time Series Data
```
GET /api/orion/aum-time-series?orionEntityId=17&grouping=5&startDate=2008-01-01&endDate=2008-12-31
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "as_of_date": "2008-06-21",
            "value": "262824.47",
            "grouping": 5
        },
        {
            "as_of_date": "2008-06-18",
            "value": "0.00",
            "grouping": 5
        }
    ]
}
```

## Usage Examples

### Backend Functions

```typescript
// Store AUM data
const result = await storeOrionAumHistory(aumDataArray, firmIntegrationConfigId);

// Get time series
const timeSeries = await getOrionAumTimeSeries(17, {
    grouping: 5,
    startDate: '2008-01-01',
    endDate: '2008-12-31',
    firmIntegrationConfigId: 123
});
```

### Database Queries

```sql
-- Get recent AUM data for entity 17
SELECT * FROM get_orion_aum_time_series(17, NULL, '2023-01-01', NULL, 123);

-- Bulk insert AUM data
SELECT insert_orion_aum_batch('[
    {"id": 17, "grouping": 5, "asOfDate": "2008-06-18", "value": 0},
    {"id": 17, "grouping": 5, "asOfDate": "2008-06-21", "value": 262824.47}
]'::jsonb, 123);
```

## Performance Characteristics

- **Large Dataset Support**: Designed for millions of records
- **Fast Retrieval**: Optimized indexes for common query patterns
- **Efficient Storage**: DECIMAL for precise financial calculations
- **Bulk Operations**: Batch insert function for high-throughput data loading
- **Recent Data Priority**: Partial indexes prioritize frequently accessed recent data
- **Upsert Logic**: Handles duplicate data gracefully

## Migration

To apply the optimized table structure:

```bash
# Apply the optimization migration
npx drizzle-kit push
```

This will:
1. Drop the existing `orion_aum_history` table
2. Create the optimized version with all indexes
3. Add the bulk insert and time series functions

## Future Enhancements

- **Table Partitioning**: Can be added for even larger datasets (partition by year)
- **Materialized Views**: For pre-computed aggregations
- **Compression**: PostgreSQL table compression for historical data
- **Archiving**: Move old data to separate archive tables 