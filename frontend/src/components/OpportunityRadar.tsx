import React from "react";

export default function OpportunityRadar({ radar }: any) {
  if (!radar) return null;

  return (
    <div className="feature-card radar-card">
      <div className="feature-title">
        🎯 Opportunity Radar
      </div>

      <div className="feature-main">
        {radar.zone}
      </div>

      <div className="feature-score">
        Priority Score: {radar.priority_score}
      </div>

      <div className="feature-gain">
        Potential Gain: {radar.potential_gain}
      </div>
    </div>
  );
}