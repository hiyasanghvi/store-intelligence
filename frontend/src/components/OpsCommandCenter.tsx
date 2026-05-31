import type { ConnectionStatus, StoreMetrics } from '../hooks/useStoreSSE';
import type { Anomaly } from './AnomaliesLog';

interface OpsCommandCenterProps {
  metrics: StoreMetrics;
  anomalies: Anomaly[];
  connectionStatus: ConnectionStatus;
}

export default function OpsCommandCenter({ metrics, anomalies, connectionStatus }: OpsCommandCenterProps) {
  const severe = anomalies.find((a) => a.severity === 'CRITICAL') ?? anomalies[0];
  const queuePressure = metrics.queue_depth >= 4;
  const conversionRisk = metrics.unique_visitors > 0 && metrics.conversion_rate < 0.25;

  const actions = [
    {
      title: queuePressure ? 'Dispatch staff to billing' : 'Checkout capacity normal',
      status: queuePressure ? 'urgent' : 'clear',
      detail: queuePressure ? `${metrics.queue_depth} customers are in queue.` : 'No queue intervention needed.',
    },
    {
      title: conversionRisk ? 'Recover conversion drop' : 'Conversion within range',
      status: conversionRisk ? 'watch' : 'clear',
      detail: conversionRisk ? 'Use zone dwell to guide assisted selling.' : 'Keep monitoring funnel movement.',
    },
    {
      title: severe ? severe.anomaly_type.replace(/_/g, ' ') : 'No active anomaly',
      status: severe ? severe.severity.toLowerCase() : 'clear',
      detail: severe ? severe.suggested_action : 'System is ready for the next event burst.',
    },
  ];

  return (
    <div className="panel-card ops-card">
      <div className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Operations Command
        <span className={`panel-title-badge ops-${connectionStatus}`}>{connectionStatus}</span>
      </div>

      <div className="ops-scoreboard">
        <div>
          <strong>{anomalies.length}</strong>
          <span>active alerts</span>
        </div>
        <div>
          <strong>{metrics.queue_depth}</strong>
          <span>queue depth</span>
        </div>
        <div>
          <strong>{Math.round(metrics.conversion_rate * 100)}%</strong>
          <span>conversion</span>
        </div>
      </div>

      <div className="ops-action-list">
        {actions.map((action) => (
          <div key={action.title} className={`ops-action ${action.status}`}>
            <span className="ops-dot" />
            <div>
              <strong>{action.title}</strong>
              <small>{action.detail}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
