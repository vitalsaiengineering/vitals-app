import React from "react";

const Valuation = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Valuation</h1>
      <div className="w-full h-[800px]">
        <iframe 
          src="https://preview--valuation-estimate.lovable.app/"
          className="w-full h-full border-none rounded-lg shadow-md"
          title="Valuation Tool"
        />
      </div>
    </div>
  );
};

export default Valuation;