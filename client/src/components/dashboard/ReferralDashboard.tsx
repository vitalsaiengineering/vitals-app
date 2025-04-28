import React, { useState, useEffect, useMemo } from "react";
import { getReferralData, Client, Referrer, ReferralData } from "@/lib/clientData";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";




// // --- All Referrals Table (Placeholder for now) ---
interface AllReferralsTableProps {
  clients: Client[];
  referrers: Referrer[]; // Needed to display referrer name
}
const AllReferralsTable: React.FC<AllReferralsTableProps> = ({
  clients,
  referrers,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  // Add state for filters (referrer, date range) if needed

  const referrerMap = useMemo(() => {
    return referrers.reduce(
      (map, ref) => {
        map[ref.id] = ref.name;
        return map;
      },
      {} as Record<string, string>,
    );
  }, [referrers]);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase()),
      // Add other filter logic here (referrer, date)
    );
  }, [clients, searchTerm]);

  return (
    <DashboardCard>
      <h3 className="text-sm font-medium text-blue-600 mb-4 uppercase">
        All Referrals
      </h3>
      {/* Add Search and Filter controls here */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 p-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {/* Add Referrer Filter Dropdown and Date Sorter */}
      </div>

      {filteredClients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b bg-gray-50">
                <th className="py-2 px-3 font-normal">Client Name</th>
                <th className="py-2 px-3 font-normal">Company</th>
                <th className="py-2 px-3 font-normal">Segment</th>
                <th className="py-2 px-3 font-normal">Referred By</th>
                <th className="py-2 px-3 font-normal text-right">AUM</th>
                <th className="py-2 px-3 font-normal">Referral Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 px-3">{client.name}</td>
                  <td className="py-2 px-3">{client.company}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        client.segment === "Gold"
                          ? "bg-yellow-100 text-yellow-800"
                          : client.segment === "Platinum"
                            ? "bg-blue-100 text-blue-800"
                            : client.segment === "Silver"
                              ? "bg-gray-200 text-gray-800"
                              : "bg-orange-100 text-orange-800" // Bronze or default
                      }`}
                    >
                      {client.segment}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {referrerMap[client.referredById] || "Unknown"}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-gray-700">
                    {formatCurrency(client.aum)}
                  </td>
                  <td className="py-2 px-3">{client.referralDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No clients match your search criteria.
        </p>
      )}
    </DashboardCard>
  );
};



// --- Helper Functions ---
const formatCurrency = (value: number): string => {
  // Ensure value is a number before formatting
  if (typeof value !== "number" || isNaN(value)) {
    return "$0"; // Or return a placeholder like '$--'
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// --- Reusable Components ---
interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}
const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className,
}) => (
  <div className={`bg-white shadow rounded-lg p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    // Updated styling to match screenshot (border bottom)
    className={`py-2 px-4 text-sm font-medium rounded-t-md ${
      // Use rounded-t-md if tabs sit directly on the border
      isActive
        ? "border-b-2 border-blue-600 text-blue-700 font-semibold"
        : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent" // Add transparent border for alignment
    }`}
  >
    {children}
  </button>
);

// --- Custom Tooltip Component ---
interface CustomTooltipContentProps extends TooltipProps<ValueType, NameType> {
  totalReferrals: number; // Pass totalReferrals down
}

const CustomTooltip: React.FC<CustomTooltipContentProps> = ({
  active,
  payload,
  totalReferrals,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the data object passed to the Pie segment
    const percentage =
      totalReferrals > 0 ? ((data.value / totalReferrals) * 100).toFixed(0) : 0;

    // Get company name from data if available, otherwise use referrer name
    // const companyName = data.company || 'Acme Inc.'; // Example if company was needed

    return (
      <div className="bg-white p-3 rounded shadow-lg border border-gray-200 text-sm">
        <p className="font-semibold text-gray-800">{data.name}</p>
        {/* <p className="text-xs text-gray-500">{companyName}</p> */}
        <p className="text-gray-600 mt-1">{data.value} referrals</p>
        <p className="text-gray-600">{percentage}% of total</p>
      </div>
    );
  }

  return null;
};

// --- Chart Component ---
interface TotalReferralsChartProps {
  data: Referrer[];
  totalReferrals: number;
  selectedReferrer: Referrer | null;
  onSelect: (referrer: Referrer | null) => void;
}
const TotalReferralsChart: React.FC<TotalReferralsChartProps> = ({
  data,
  totalReferrals,
  selectedReferrer,
  onSelect,
}) => {
  // Pass the original referrer data including 'company' if available, or add it here
  const chartData = data.map((r) => ({
    name: r.name,
    value: r.referrals,
    id: r.id,
    color: r.color,
    // company: r.company // Example if referrer had a company field
  }));

  const activeIndex = selectedReferrer
    ? data.findIndex((r) => r.id === selectedReferrer.id)
    : -1;

  // Use recharts data payload on click
  const handlePieClick = (pieData: any, index: number) => {
    const clickedReferrerId = pieData?.payload?.id;
    if (!clickedReferrerId) return;

    const fullReferrerData =
      data.find((r) => r.id === clickedReferrerId) || null;

    if (selectedReferrer && selectedReferrer.id === clickedReferrerId) {
      onSelect(null); // Deselect if clicking the active slice
    } else {
      onSelect(fullReferrerData);
    }
  };

  return (
    <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto">
      {" "}
      {/* Adjusted size */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Add the Tooltip component with custom content */}
          <Tooltip
            content={<CustomTooltip totalReferrals={totalReferrals} />}
            cursor={{ fill: "transparent" }} // Hide default cursor block
            wrapperStyle={{ zIndex: 10 }} // Ensure tooltip is above other elements
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="70%" // Adjusted inner radius
            outerRadius="100%" // Adjusted outer radius
            paddingAngle={2}
            dataKey="value"
            onClick={handlePieClick}
            activeIndex={activeIndex}
            // activeShape={...} // Could be used for more complex interactions/positioning
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="cursor-pointer focus:outline-none"
                stroke="#fff"
                strokeWidth={activeIndex === index ? 3 : 1} // Highlight border on active
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center Content - Adjusted styling */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <div className="text-xs text-gray-500 uppercase">Total Referred</div>
        <div className="text-4xl font-bold text-gray-800 mt-1">
          {totalReferrals}
        </div>
        {/* Center content remains unchanged, tooltip handles hover details */}
        {/* Optional: Show selected referrer info here too if desired */}
        {/* {selectedReferrer && (
                    <div className="mt-2 px-1">
                        <div className="text-sm text-gray-800 font-medium truncate">{selectedReferrer.name}</div>
                        <div className="text-xs text-gray-500">{selectedReferrer.referrals} referrals</div>
                        <div className="text-xs text-gray-500">{totalReferrals > 0 ? ((selectedReferrer.referrals / totalReferrals) * 100).toFixed(0) : 0}% of total</div>
                    </div>
                 )} */}
      </div>
    </div>
  );
};

// --- Top Referrers List Component ---
interface TopReferrersListProps {
  referrers: Referrer[];
  totalReferrals: number;
  selectedReferrerId: string | null;
  onSelect: (referrer: Referrer) => void;
}
const TopReferrersList: React.FC<TopReferrersListProps> = ({
  referrers,
  totalReferrals,
  selectedReferrerId,
  onSelect,
}) => (
  // Keep 2 columns, adjust gap if needed
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
    {referrers.map((referrer) => {
      const percentage =
        totalReferrals > 0
          ? ((referrer.referrals / totalReferrals) * 100).toFixed(0)
          : 0;
      const isSelected = referrer.id === selectedReferrerId;
      return (
        <div
          key={referrer.id}
          onClick={() => onSelect(referrer)}
          // Updated selection style to light grey background
          className={`flex items-center cursor-pointer p-2 rounded ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"}`}
        >
          <span
            className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
            style={{ backgroundColor: referrer.color }}
          ></span>
          <div className="flex-grow">
            <div
              className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-800"}`}
            >
              {referrer.name}
            </div>
            <div className="text-xs text-gray-500">
              {referrer.referrals} ({percentage}%)
            </div>
          </div>
        </div>
      );
    })}
  </div>
);


// --- Referred Clients Table (Ensure internal structure is correct) ---
interface ReferredClientTableProps {
    clients: Client[];
    referrerName?: string;
    totalAum?: number;
    className?: string; // Expecting classes like "h-full" or similar context
}
const ReferredClientTable: React.FC<ReferredClientTableProps> = ({ clients, referrerName, totalAum, className }) => {
    const isAllClientsView = !referrerName;
    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => (b.aum || 0) - (a.aum || 0));
    }, [clients]);

    // Main container: MUST be flex-col to manage header/body height
    // Apply passed className for height context (e.g., h-full)
    return (
        <div className={`flex flex-col ${className}`}>
            {/* Header Section (Fixed height, does not scroll) */}
            <div className="flex-shrink-0"> {/* Prevent header from shrinking */}
                {/* Conditional Header logic ... */}
                <div className="flex flex-wrap justify-between items-center mb-4 px-1 gap-x-4 gap-y-2">
                   {/* ... header content ... */}
                   {isAllClientsView ? (
                        <h3 className="text-sm font-medium text-blue-600 uppercase">
                            All Referred Clients
                        </h3>
                    ) : (
                        <>
                            <h3 className="text-sm font-medium text-blue-600 uppercase whitespace-nowrap">
                                Clients Referred by {referrerName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-gray-500">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                    {clients.length} clients
                                 </span>
                                 <span className="text-gray-700">
                                    Total AUM: <span className="font-semibold text-green-600">{formatCurrency(totalAum ?? 0)}</span>
                                 </span>
                             </div>
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable Table Body */}
            {sortedClients.length > 0 ? (
                // This div MUST take remaining space and enable scroll
                // min-h-0 is CRUCIAL for flex-grow + overflow-y-auto to work correctly
                <div className="flex-grow overflow-y-auto min-h-0">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
                            <tr className="text-gray-500 border-b">
                                <th className="py-2 px-3 font-normal">Name</th>
                                <th className="py-2 px-3 font-normal">Company</th>
                                <th className="py-2 px-3 font-normal text-right">AUM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClients.map(client => (
                                <tr key={client.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                    <td className="py-2.5 px-3">{client.name}</td>
                                    <td className="py-2.5 px-3">{client.company}</td>
                                    <td className="py-2.5 px-3 text-right font-medium text-green-600">{formatCurrency(client.aum)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // Placeholder also needs to grow if table is empty
                <p className="text-gray-500 text-center py-4 flex-grow flex items-center justify-center">
                    {isAllClientsView ? "No referred clients found." : "No clients to display for this referrer."}
                </p>
            )}
        </div>
    );
};


// --- Main Dashboard Component (Using Grid) ---
export const ReferralDashboard: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("topSources");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getReferralData();
        setReferralData(data);
      } catch (err) {
        setError("Failed to load referral data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalReferrals = useMemo(() => {
    return (
      referralData?.referrers.reduce((sum, r) => sum + r.referrals, 0) ?? 0
    );
  }, [referralData]);

  const clientsForSelectedReferrer = useMemo(() => {
    if (!referralData || !selectedReferrer) return [];
    // Ensure clients have AUM before reducing
    const clientsWithAum = referralData.clients.filter(
      (client) =>
        client.referredById === selectedReferrer.id &&
        typeof client.aum === "number",
    );
    return clientsWithAum.sort((a, b) => a.name.localeCompare(b.name)); // Example sort
  }, [referralData, selectedReferrer]);

  const totalAumForSelected = useMemo(() => {
    // Ensure clients have AUM before reducing
    return clientsForSelectedReferrer.reduce(
      (sum, client) => sum + (client.aum || 0),
      0,
    );
  }, [clientsForSelectedReferrer]);

  const handleSelectReferrer = (referrer: Referrer | null) => {
    setSelectedReferrer(referrer);
  };

  const clearSelection = () => {
    setSelectedReferrer(null);
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading Referral Analytics...
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }
  if (!referralData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No referral data available.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Referral Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your top referral sources and measure their performance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <TabButton
          isActive={activeTab === "topSources"}
          onClick={() => setActiveTab("topSources")}
        >
          Top Referral Sources
        </TabButton>
        <TabButton
          isActive={activeTab === "allReferrals"}
          onClick={() => setActiveTab("allReferrals")}
        >
          All Referrals
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'topSources' && (
                // Use a container that allows the card to define its height based on content
                <div>
                    <DashboardCard className="h-full"> {/* Ensure card can take full height if needed */}
                         {/* Use Grid for the main two-column layout */}
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full">

                            {/* Left Column (Chart + List) */}
                            {/* Grid column height is determined by the grid row */}
                            <div className="lg:col-span-5 space-y-6 flex flex-col"> {/* Make left col flex too */}
                                <h3 className="text-sm font-medium text-blue-600 uppercase flex-shrink-0">Top Referral Sources</h3>
                                <div className="flex justify-center flex-shrink-0"> {/* Chart area */}
                                     <TotalReferralsChart
                                        data={referralData.referrers}
                                        totalReferrals={totalReferrals}
                                        selectedReferrer={selectedReferrer}
                                        onSelect={handleSelectReferrer}
                                    />
                                </div>
                                <div className="flex-grow"> {/* Allow list to take space */}
                                    <TopReferrersList
                                        referrers={referralData.referrers}
                                        totalReferrals={totalReferrals}
                                        selectedReferrerId={selectedReferrer?.id ?? null}
                                        onSelect={handleSelectReferrer}
                                    />
                                     {selectedReferrer && (
                                        <button
                                            onClick={clearSelection}
                                            className="text-sm text-blue-600 hover:text-blue-800 mt-5"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Column (Client Table) */}
                            {/* This grid column needs a defined height context for overflow */}
                            {/* Use relative and absolute positioning for the scroll container */}
                            <div className="lg:col-span-7 relative"> {/* Set relative parent */}
                                <div className="absolute inset-0 flex flex-col"> {/* Absolute child to fill parent */}
                                    {selectedReferrer ? (
                                        <ReferredClientTable
                                            // flex-grow and min-h-0 allow it to fill the absolute container
                                            className="flex-grow min-h-0"
                                            clients={clientsForSelectedReferrer}
                                            referrerName={selectedReferrer.name}
                                            totalAum={totalAumForSelected}
                                        />
                                    ) : (
                                        <ReferredClientTable
                                            className="flex-grow min-h-0"
                                            clients={referralData.clients}
                                        />
                                    )}
                                </div>
                            </div>
                         </div>
                    </DashboardCard>
                </div>
      )}

      {activeTab === 'allReferrals' && (
           <AllReferralsTable clients={referralData.clients} referrers={referralData.referrers} />
      )}
    </div>
  );
};

// --- Add default export if this is the main export of the file ---
export default ReferralDashboard;
