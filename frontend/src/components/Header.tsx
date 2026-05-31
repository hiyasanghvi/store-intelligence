import React, { useState, useEffect } from 'react';

interface TopBarProps {
  activeView: string;
  storeId: string;
  lastUpdated: string | null;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Live Dashboard',
  analytics: 'Deep Analytics',
  events: 'Event Feed',
  comparison: 'Store Comparison',
  cameras: 'Vision Center',
};

export const TopBar: React.FC<TopBarProps> = ({ activeView, storeId, lastUpdated }) => {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{VIEW_TITLES[activeView] ?? activeView}</div>
        <div className="topbar-breadcrumb">
          <span>APEX Intelligence</span>
          <span style={{ color: '#334155' }}>›</span>
          <span>{storeId.replace('STORE_', '').replace(/_/g, ' ')}</span>
          {lastUpdated && (
            <>
              <span style={{ color: '#334155' }}>›</span>
              <span style={{ color: '#10b981' }}>Updated now</span>
            </>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {lastUpdated && (
          <div className="data-freshness">
            <span className="freshness-dot" />
            Live data received
          </div>
        )}
        <div className="topbar-clock">{clock}</div>
      </div>
    </div>
  );
};

export default TopBar;
