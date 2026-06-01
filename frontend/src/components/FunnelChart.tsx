import React from 'react';

export interface FunnelStage {
  stage: string;
  count: number;
  drop_off_pct: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

const STAGE_COLORS = [
  { solid: '#6d5dfc', soft: 'rgba(109, 93, 252, 0.12)' },
  { solid: '#0891b2', soft: 'rgba(8, 145, 178, 0.12)' },
  { solid: '#059669', soft: 'rgba(5, 150, 105, 0.12)' },
  { solid: '#d97706', soft: 'rgba(217, 119, 6, 0.12)' },
  { solid: '#e11d48', soft: 'rgba(225, 29, 72, 0.12)' },
];

function stageLabel(stage: string) {
  return stage.replace(/_/g, ' ');
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="no-data">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
        No funnel data available
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);
  const firstCount = Math.max(stages[0]?.count ?? 0, 1);
  const finalCount = stages[stages.length - 1]?.count ?? 0;

  return (
    <div className="funnel-container">
      <div className="funnel-journey-chart">
        {stages.map((stage, idx) => {
          const ratio = Math.max(0.04, stage.count / maxCount);
          const color = STAGE_COLORS[idx % STAGE_COLORS.length];
          const retention = Math.round((stage.count / firstCount) * 100);
          const previous = stages[idx - 1];
          const lostFromPrevious = previous ? Math.max(0, previous.count - stage.count) : 0;

          return (
            <div
              key={stage.stage}
              className="funnel-journey-row"
              style={{ ['--stage-color' as string]: color.solid, ['--stage-soft' as string]: color.soft }}
            >
              <div className="funnel-step-index">{idx + 1}</div>
              <div className="funnel-step-copy">
                <div className="funnel-stage-header">
                  <span className="funnel-stage-name">{stageLabel(stage.stage)}</span>
                  <span className="funnel-stage-count">{stage.count.toLocaleString()} shoppers</span>
                </div>
                <div className="funnel-rail" aria-label={`${stageLabel(stage.stage)} retention ${retention}%`}>
                  <div className="funnel-rail-fill" style={{ width: `${ratio * 100}%` }} />
                </div>
                <div className="funnel-stage-meta">
                  <span>{retention}% of entries retained</span>
                  {idx > 0 && (
                    <span className={stage.drop_off_pct > 0 ? 'funnel-drop' : 'funnel-drop neutral'}>
                      {lostFromPrevious.toLocaleString()} lost here / {stage.drop_off_pct}% drop
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="funnel-summary-strip">
        <div>
          <span>Start</span>
          <strong>{stages[0]?.count.toLocaleString() ?? 0}</strong>
        </div>
        <div>
          <span>Purchase</span>
          <strong>{finalCount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Overall conversion</span>
          <strong>{Math.round((finalCount / firstCount) * 100)}%</strong>
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
