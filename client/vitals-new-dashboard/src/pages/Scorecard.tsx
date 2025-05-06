
import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";

const Scorecard = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Scorecard</h1>
        <div className="w-full h-[800px]">
          <iframe 
            src="https://preview--fin-savvy-visuals.lovable.app/"
            className="w-full h-full border-none rounded-lg shadow-md"
            title="Financial Dashboard"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Scorecard;
