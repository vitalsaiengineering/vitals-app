# Centralized Mock Data System

This directory contains the centralized mock data system for all reporting components. The system has been restructured to eliminate data duplication and provide a single source of truth for client information.

## File Structure

### `mockClients.json`
The core data file containing 346 realistic client records with the following properties:
- **id**: Unique client identifier
- **name**: Client full name
- **age**: Current age
- **dateOfBirth**: Birth date (YYYY-MM-DD)
- **segment**: Client tier (Platinum, Gold, Silver)
- **aum**: Assets Under Management
- **advisor**: Assigned advisor name
- **advisorId**: Advisor identifier
- **joinDate**: Date client joined the firm (YYYY-MM-DD)
- **state**: Full state name
- **stateCode**: Two-letter state code
- **city**: Client's city
- **email**: Client email address
- **phone**: Client phone number

### `mockData.js`
Main export file that combines:
- **Static chart data**: Performance charts, AUM over time, portfolio performance, etc.
- **Dynamic report data**: Generated from centralized client data using utility functions

### `clientDataUtils.js` (in `/utils/`)
Utility functions for working with client data:
- Data transformation functions
- Report generation functions
- Date calculation helpers

## Data Distribution

The 346 client records are distributed across:

### Geographic Distribution
- **California**: 78 clients (22.5%)
- **New York**: 52 clients (15.0%)
- **Texas**: 41 clients (11.8%)
- **Florida**: 35 clients (10.1%)
- **Illinois**: 28 clients (8.1%)
- **Pennsylvania**: 22 clients (6.4%)
- **Ohio**: 18 clients (5.2%)
- **Georgia**: 15 clients (4.3%)
- **North Carolina**: 12 clients (3.5%)
- **Michigan**: 10 clients (2.9%)
- **Other states**: 35 clients (10.1%)

### Segment Distribution
- **Platinum**: ~100 clients (high-value, typically older clients)
- **Gold**: ~146 clients (middle-tier)
- **Silver**: ~100 clients (entry-level, typically younger clients)

### Age Distribution
- **Under 30**: ~8% of clients
- **30-45**: ~22% of clients  
- **46-60**: ~38% of clients (largest group)
- **61-75**: ~25% of clients
- **Over 75**: ~7% of clients

## Generated Reports

The following reports are now dynamically generated from the centralized client data:

1. **AgeDemographicsReport**: Age bracket analysis with AUM distribution
2. **ClientDistributionByState**: Geographic distribution and metrics
3. **ClientAnniversaryData**: Upcoming client anniversaries and tenure analysis
4. **ClientBirthdayReport**: Upcoming birthdays and client details
5. **BookDevelopmentBySegmentReport**: Segment-wise performance metrics
6. **ClientSegmentationDashboard**: Comprehensive segmentation analysis

## Usage

### Importing Static Data
```javascript
import mockData from '../data/mockData.js';
const chartData = mockData.PerformanceChart;
```

### Importing Dynamic Reports
```javascript
import mockData from '../data/mockData.js';
const ageReport = mockData.AgeDemographicsReport; // Generates fresh data
```

### Using Utility Functions Directly
```javascript
import { 
  getAllClients, 
  generateAgeDemographicsReport 
} from '../utils/clientDataUtils.js';

const allClients = getAllClients();
const ageReport = generateAgeDemographicsReport();
```

## Benefits

1. **Single Source of Truth**: All client data comes from one centralized file
2. **Data Consistency**: No duplicate or conflicting client information
3. **Dynamic Generation**: Reports are generated fresh with accurate calculations
4. **Easy Maintenance**: Update client data in one place affects all reports
5. **Realistic Relationships**: All client properties are correlated and realistic
6. **Scalability**: Easy to add new client properties or reports

## Migration Notes

The old `mockData.json` file has been replaced with:
- `mockClients.json`: Centralized client data
- `mockData.js`: Combined static and dynamic data export
- `clientDataUtils.js`: Utility functions for data transformation

Components should now import from `mockData.js` instead of `mockData.json` to get the benefits of the new centralized system. 