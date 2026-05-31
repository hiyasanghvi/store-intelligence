import React from "react";

export default function BeautyBlackHole({ data }: any) {
  if (!data) return null;

  return (
    <div className="feature-card blackhole-card">
      <div className="feature-title">
        ⚠ Beauty Black Hole
      </div>

      <div className="feature-main">
        {data.zone}
      </div>

      <div>
        Lost Visitors: {data.lost_visitors}
      </div>

      <div>
        Conversion Gap: {data.conversion_gap}%
      </div>
    </div>
  );
}