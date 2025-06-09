import mockClientsData from '../data/mockClients.json' with { type: 'json' };

// Get all clients
export const getAllClients = () => {
  return mockClientsData.clients;
};

// Get all advisors
export const getAllAdvisors = () => {
  return mockClientsData.advisors;
};

// Calculate age from birth date
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate client tenure in years
export const calculateTenure = (joinDate) => {
  const today = new Date();
  const joinDateObj = new Date(joinDate);
  const diffTime = Math.abs(today - joinDateObj);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  return diffYears;
};

// Calculate next birthday
export const calculateNextBirthday = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return nextBirthday;
};

// Calculate next anniversary
export const calculateNextAnniversary = (joinDate) => {
  const today = new Date();
  const joinDateObj = new Date(joinDate);
  const nextAnniversary = new Date(today.getFullYear(), joinDateObj.getMonth(), joinDateObj.getDate());
  
  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(today.getFullYear() + 1);
  }
  
  return nextAnniversary;
};

// Calculate days until date
export const calculateDaysUntil = (targetDate) => {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Format date for display
export const formatDateForDisplay = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

// Generate Age Demographics Report data
export const generateAgeDemographicsReport = () => {
  const clients = getAllClients();
  const totalClients = clients.length;
  const totalAUM = clients.reduce((sum, client) => sum + client.aum, 0);
  const averageClientAge = clients.reduce((sum, client) => sum + client.age, 0) / totalClients;

  // Age brackets
  const ageBrackets = {
    '<20': { min: 0, max: 19 },
    '21-40': { min: 21, max: 40 },
    '41-60': { min: 41, max: 60 },
    '61-80': { min: 61, max: 80 },
    '>80': { min: 81, max: 150 }
  };

  const byAgeBracket = Object.entries(ageBrackets).map(([bracket, range]) => {
    const bracketClients = clients.filter(client => 
      client.age >= range.min && client.age <= range.max
    );
    
    const clientCount = bracketClients.length;
    const clientPercentage = ((clientCount / totalClients) * 100).toFixed(1);
    const aum = bracketClients.reduce((sum, client) => sum + client.aum, 0);
    const aumPercentage = ((aum / totalAUM) * 100).toFixed(1);

    // Detailed breakdown by segment
    const segments = ['Platinum', 'Gold', 'Silver'];
    const detailedBreakdown = segments.map(segment => {
      const segmentClients = bracketClients.filter(client => client.segment === segment);
      return {
        segment,
        clients: segmentClients.length,
        aum: segmentClients.reduce((sum, client) => sum + client.aum, 0)
      };
    }).filter(item => item.clients > 0);

    return {
      bracket,
      clientCount,
      clientPercentage: parseFloat(clientPercentage),
      aum,
      aumPercentage: parseFloat(aumPercentage),
      detailedBreakdown
    };
  });

  return {
    overall: {
      totalClients,
      totalAUM,
      averageClientAge: parseFloat(averageClientAge.toFixed(1))
    },
    byAgeBracket,
    clientDetails: clients.map(client => ({
      id: client.id,
      name: client.name,
      age: client.age,
      segment: client.segment,
      aum: client.aum,
      advisor: client.advisor,
      joinDate: client.joinDate
    }))
  };
};

// Generate Client Distribution by State Report data
export const generateClientDistributionByStateReport = () => {
  const clients = getAllClients();
  
  // Check for clients with missing state data
  const clientsWithMissingState = clients.filter(client => !client.stateCode || !client.state);
  if (clientsWithMissingState.length > 0) {
    console.warn('Clients with missing state data:', clientsWithMissingState.length, clientsWithMissingState);
  }
  
  // Group by state
  const stateGroups = clients.reduce((acc, client) => {
    const state = client.stateCode;
    if (!state) {
      console.warn('Client with missing stateCode:', client);
      return acc; // Skip clients without state codes
    }
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(client);
    return acc;
  }, {});

  // Calculate state metrics
  const stateMetrics = Object.entries(stateGroups).map(([stateCode, stateClients]) => {
    const clientCount = stateClients.length;
    const totalAum = stateClients.reduce((sum, client) => sum + client.aum, 0);
    
    return {
      stateName: stateClients[0].state,
      stateCode,
      clientCount,
      totalAum
    };
  }).sort((a, b) => b.clientCount - a.clientCount);

  // Find top states
  const topStateByClients = stateMetrics[0];
  const topStateByAUM = stateMetrics.reduce((max, state) => 
    state.totalAum > max.totalAum ? state : max, stateMetrics[0]
  );

  // Client details by state (all states, not just top 10)
  const clientDetailsByState = {};
  stateMetrics.forEach(state => {
    clientDetailsByState[state.stateCode] = stateGroups[state.stateCode].map(client => ({
      id: client.id,
      name: client.name,
      segment: client.segment,
      aum: client.aum
    }));
  });

  return {
    topStateByClients: {
      stateName: topStateByClients.stateName,
      value: topStateByClients.clientCount,
      metricLabel: 'clients'
    },
    topStateByAUM: {
      stateName: topStateByAUM.stateName,
      value: `$${(topStateByAUM.totalAum / 1000000).toFixed(1)}M`,
      metricLabel: 'AUM'
    },
    stateMetrics,
    clientDetailsByState
  };
};

// Generate Client Anniversary Data
export const generateClientAnniversaryData = () => {
  const clients = getAllClients();
  const advisors = getAllAdvisors();

  const clientsWithAnniversary = clients.map(client => {
    const nextAnniversary = calculateNextAnniversary(client.joinDate);
    const daysUntil = calculateDaysUntil(nextAnniversary);
    const tenure = calculateTenure(client.joinDate);

    return {
      id: client.id,
      clientName: client.name,
      segment: client.segment,
      nextAnniversaryDate: nextAnniversary.toISOString().split('T')[0],
      daysUntilNextAnniversary: daysUntil,
      yearsWithFirm: tenure,
      advisorName: client.advisor
    };
  });

  return {
    totalRecords: clients.length,
    filterOptions: {
      segments: ['All Segments', 'Platinum', 'Gold', 'Silver'],
      tenures: ['Any Tenure', '1-2 years', '3-5 years', '6-10 years', '10+ years'],
      advisors: [
        { id: 'all', name: 'All Advisors' },
        ...advisors.map(advisor => ({ id: advisor.id, name: advisor.name }))
      ]
    },
    clients: clientsWithAnniversary
  };
};

// Generate Client Birthday Report data
export const generateClientBirthdayReport = () => {
  const clients = getAllClients();
  const advisors = getAllAdvisors();

  const clientsWithBirthday = clients.map(client => {
    const nextBirthday = calculateNextBirthday(client.dateOfBirth);
    const tenure = calculateTenure(client.joinDate);
    const turningAge = client.age + 1;

    return {
      id: client.id,
      clientName: client.name,
      grade: client.segment,
      dateOfBirth: client.dateOfBirth,
      nextBirthdayDisplay: formatDateForDisplay(nextBirthday),
      nextBirthdayDate: nextBirthday.toISOString().split('T')[0],
      turningAge,
      aum: client.aum,
      clientTenure: `${tenure} year${tenure !== 1 ? 's' : ''}`,
      advisorName: client.advisor
    };
  });

  return {
    filters: {
      grades: ['Platinum', 'Gold', 'Silver'],
      advisors: advisors.map(advisor => advisor.name)
    },
    clients: clientsWithBirthday
  };
};

// Generate Book Development by Segment Report data
export const generateBookDevelopmentBySegmentReport = () => {
  const clients = getAllClients();
  
  // Define segment colors
  const SEGMENT_COLORS = {
    Platinum: {
      base: 'hsl(222, 47%, 44%)',
      fill: 'hsl(222, 47%, 44%)'
    },
    Gold: {
      base: 'hsl(216, 65%, 58%)',
      fill: 'hsl(216, 65%, 58%)'
    },
    Silver: {
      base: 'hsl(210, 55%, 78%)',
      fill: 'hsl(210, 55%, 78%)'
    }
  };

  // Generate yearly data for charts (2019-2025)
  const generateYearlyData = (segmentClients, baseValue, growthRate, isAUM = false) => {
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    let previousValue = null;
    
    return years.map(year => {
      // Calculate value with some growth and random variation
      const yearIndex = year - 2019;
      let value = baseValue * Math.pow(1 + growthRate, yearIndex);
      
      // Add some realistic variation
      const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
      value = Math.round(value * variation);
      
      if (isAUM) {
        // For AUM, scale by actual segment size
        const segmentMultiplier = segmentClients.length / 50; // Adjust based on segment size
        value = Math.round(value * segmentMultiplier);
      } else {
        // For client count, use actual client count as basis
        value = Math.max(1, Math.round(segmentClients.length * (1 + yearIndex * 0.05)));
      }

      const dataPoint = {
        year,
        value,
        previousYearValue: previousValue
      };
      
      previousValue = value;
      return dataPoint;
    });
  };

  // Group clients by segment
  const segmentGroups = clients.reduce((acc, client) => {
    const segment = client.segment;
    if (!acc[segment]) {
      acc[segment] = [];
    }
    acc[segment].push(client);
    return acc;
  }, {});

  // Format clients for each segment
  const formatClientsForSegment = (segmentClients, segmentName) => {
    return segmentClients.map(client => {
      const tenure = calculateTenure(client.joinDate);
      return {
        id: client.id,
        name: client.name,
        segment: segmentName,
        yearsWithFirm: tenure,
        yearsWithFirmText: `${tenure} year${tenure !== 1 ? 's' : ''}`,
        sinceDateText: `Since ${new Date(client.joinDate).getFullYear()}`,
        aum: client.aum
      };
    });
  };

  // Create allSegmentsData structure
  const allSegmentsData = ['Platinum', 'Gold', 'Silver'].map(segmentName => {
    const segmentClients = segmentGroups[segmentName] || [];
    const segmentColor = SEGMENT_COLORS[segmentName];
    
    // Base values for different segments
    const baseValues = {
      Platinum: { aum: 50000000, clientCount: 30 },
      Gold: { aum: 30000000, clientCount: 45 },
      Silver: { aum: 15000000, clientCount: 60 }
    };

    const baseValue = baseValues[segmentName];
    
    return {
      name: segmentName,
      color: segmentColor.base,
      fillColor: segmentColor.fill,
      dataAUM: generateYearlyData(segmentClients, baseValue.aum, 0.08, true),
      dataClientCount: generateYearlyData(segmentClients, baseValue.clientCount, 0.05, false),
      clients: formatClientsForSegment(segmentClients, segmentName)
    };
  });

  return {
    allSegmentsData
  };
};

// Generate Client Segmentation Dashboard data
export const generateClientSegmentationDashboard = () => {
  const clients = getAllClients();
  const advisors = getAllAdvisors();
  
  // Overall metrics
  const totalClients = clients.length;
  const totalAUM = clients.reduce((sum, client) => sum + client.aum, 0);
  const averageAUM = totalAUM / totalClients;

  // Group clients by segment for table data
  const segmentGroups = clients.reduce((acc, client) => {
    const segment = client.segment;
    if (!acc[segment]) {
      acc[segment] = [];
    }
    acc[segment].push(client);
    return acc;
  }, {});

  // Format clients for table display
  const formatClientsForTable = (clientList) => {
    return clientList.map(client => {
      const tenure = calculateTenure(client.joinDate);
      return {
        id: client.id,
        name: client.name,
        age: client.age,
        yearsWithFirm: tenure,
        assets: client.aum // Note: component expects 'assets' property
      };
    });
  };

  // Create KPIs structure
  const kpis = {
    clientCount: {
      value: totalClients.toString(),
      label: 'Total Clients'
    },
    totalAUM: {
      value: `$${(totalAUM / 1000000).toFixed(1)}M`,
      label: 'Total Assets Under Management'
    },
    averageClientAUM: {
      value: `$${(averageAUM / 1000).toFixed(0)}K`,
      label: 'Average Client AUM'
    }
  };

  // Create donut chart data
  const donutChartData = ['Platinum', 'Gold', 'Silver'].map(segment => {
    const segmentClients = segmentGroups[segment] || [];
    const count = segmentClients.length;
    const percentage = ((count / totalClients) * 100);
    
    // Segment colors
    const colors = {
      Platinum: 'hsl(222, 47%, 44%)',
      Gold: 'hsl(216, 65%, 58%)',
      Silver: 'hsl(210, 55%, 78%)'
    };

    return {
      name: segment,
      count,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      color: colors[segment]
    };
  });

  // Create table data structure
  const tableData = {
    allSegments: {
      Platinum: formatClientsForTable(segmentGroups.Platinum || []),
      Gold: formatClientsForTable(segmentGroups.Gold || []),
      Silver: formatClientsForTable(segmentGroups.Silver || [])
    },
    segmentName: 'All', // Default segment name
    clients: formatClientsForTable(clients) // All clients
  };

  // Create advisor options for the dropdown
  const advisorOptions = [
    { id: 'firm_overview', name: 'Firm Overview' },
    ...advisors.map(advisor => ({
      id: advisor.id.toString(),
      name: advisor.name
    }))
  ];

  return {
    kpis,
    donutChartData,
    tableData,
    advisorOptions,
    currentAdvisorOrFirmView: 'firm_overview'
  };
};

// Generate Client Inception Data
export const generateClientInceptionData = () => {
  const clients = getAllClients();
  const advisors = getAllAdvisors();
  
  // Get current year and calculate KPIs
  const currentYear = new Date().getFullYear();
  const currentYearClients = clients.filter(client => 
    new Date(client.joinDate).getFullYear() === currentYear
  );
  
  const previousYearClients = clients.filter(client => 
    new Date(client.joinDate).getFullYear() === currentYear - 1
  );
  
  const ytdNewClients = currentYearClients.length;
  const previousYearCount = previousYearClients.length;
  const percentageChange = previousYearCount > 0 
    ? Math.round(((ytdNewClients - previousYearCount) / previousYearCount) * 100)
    : 100;

  // Generate chart data (yearly breakdown by segment)
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const chartData = years.map(year => {
    const yearClients = clients.filter(client => 
      new Date(client.joinDate).getFullYear() === year
    );
    
    const segmentCounts = {
      Platinum: yearClients.filter(client => client.segment === 'Platinum').length,
      Gold: yearClients.filter(client => client.segment === 'Gold').length,
      Silver: yearClients.filter(client => client.segment === 'Silver').length,
    };

    return {
      year,
      ...segmentCounts
    };
  });

  // Generate chart legend (current year data)
  const currentYearData = chartData.find(data => data.year === currentYear) || { Platinum: 0, Gold: 0, Silver: 0 };
  const chartLegend = [
    { segment: 'Platinum', count: currentYearData.Platinum },
    { segment: 'Gold', count: currentYearData.Gold },
    { segment: 'Silver', count: currentYearData.Silver }
  ];

  // Get available years for dropdown
  const availableYears = years.slice().reverse(); // Most recent first

  // Generate table clients (all clients with inception year data)
  const tableClients = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    segment: client.segment,
    inceptionDate: client.joinDate,
    inceptionYear: new Date(client.joinDate).getFullYear(),
    advisor: client.advisor
  }));

  return {
    kpi: {
      ytdNewClients,
      percentageChangeVsPreviousYear: percentageChange
    },
    chartData,
    chartLegend,
    availableYears,
    tableClients,
    totalTableRecords: tableClients.length
  };
}; 