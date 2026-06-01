import React, { useState, useEffect } from 'react';

interface Camera {
  cam_id: string;
  name: string;
  filename: string;
  type?: string;
  description?: string;
  zones?: Record<string, unknown>;
  available: boolean;
  stream_url: string;
}

interface CameraFeedProps {
  apiBase: string;
  storeId: string;
}

interface CameraStats {
  cam_id?: string;
  people: number;
  frame: number;
  fps: number;
}

const CAM_LABELS: Record<string, string> = {
  CAM_1: 'Main Entrance (CAM 3)',
  CAM_2: 'Makeup Area (CCTV 2)',
  CAM_3: 'Skincare Zone (CAM 1)',
  CAM_4: 'Back Store / Inventory (CAM 4)',
  CAM_5: 'Billing Queue (CAM 5)',
};

const CAM_TYPE_LABELS: Record<string, string> = {
  CAM_2: 'makeup area',
  CAM_3: 'skincare',
  CAM_4: 'back store / inventory',
};

const CAM_ZONES_CONFIG: Record<string, { label: string; zones: { name: string; color: string }[] }> = {
  CAM_1: {
    label: 'Main Entry / Exit',
    zones: [
      { name: 'Entry Threshold', color: '#00dc64' }
    ]
  },
  CAM_2: {
    label: 'Main Floor Zone Coverage',
    zones: [
      { name: 'Skincare Aisles', color: '#b43cff' },
      { name: 'Haircare Aisles', color: '#ff783c' },
      { name: 'Fragrances Counter', color: '#3cc8ff' },
      { name: 'Wellness Section', color: '#3cffb4' }
    ]
  },
  CAM_3: {
    label: 'Billing Counter & Queue Area',
    zones: [
      { name: 'Billing Counter', color: '#008cff' },
      { name: 'Billing Queue', color: '#0050dc' },
      { name: 'Impulse Buys Shelf', color: '#50c8ff' }
    ]
  },
  CAM_4: {
    label: 'North Entry / Exit',
    zones: [
      { name: 'Entry Threshold', color: '#00dc64' }
    ]
  },
  CAM_5: {
    label: 'North Billing & Queue',
    zones: [
      { name: 'Billing Counter', color: '#008cff' },
      { name: 'Billing Queue', color: '#0050dc' }
    ]
  }
};

const ZONE_COLORS: Record<string, string> = {
  ENTRY_THRESHOLD: '#00dc64',
  BILLING_COUNTER: '#008cff',
  BILLING_QUEUE: '#0050dc',
  SKINCARE: '#b43cff',
  HAIRCARE: '#ff783c',
  FRAGRANCES: '#3cc8ff',
  WELLNESS: '#3cffb4',
  IMPULSE_BUYS: '#50c8ff',
};

function formatZoneName(zoneName: string): string {
  return zoneName
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ apiBase, storeId }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yoloOnline, setYoloOnline] = useState(false);
  const [yoloStats, setYoloStats] = useState<CameraStats | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [switching, setSwitching] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  
  const [yoloBase, setYoloBase] = useState(() => {
  return import.meta.env.VITE_API_URL || apiBase;
});

  const [streamError, setStreamError] = useState(false);
  void storeId;

  // Reset stream error when camera or yolo status changes
  useEffect(() => {
    setStreamError(false);
  }, [selected, yoloOnline]);

  // Ping YOLO server periodically to check if it's online, fallback to backend stats
  useEffect(() => {
    let active = true;
    const checkYolo = async () => {
      try {
        const r = await fetch(`${yoloBase}/stats`);
        if (r.ok) {
          if (active) {
            const data = await r.json();
            setYoloOnline(!data.error);
            setYoloStats(data);
          }
        } else {
          if (active) {
            setYoloOnline(false);
            fetchBackendStats();
          }
        }
      } catch {
        if (active) {
          setYoloOnline(false);
          fetchBackendStats();
        }
      }
    };

    const fetchBackendStats = async () => {
      if (!selected) return;
      try {
        const r = await fetch(`${apiBase}/cameras/stats/${selected}`);
        if (r.ok && active) {
          const data = await r.json();
          setYoloStats(data);
        }
      } catch {
        // ignore
      }
    };

    checkYolo();
    const interval = setInterval(checkYolo, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selected, yoloBase, apiBase]);

  // Fetch cameras list on mount or API base change
  useEffect(() => {
    fetch(`${apiBase}/cameras`)
      .then((r) => r.json())
      .then((d) => {
        const cams: Camera[] = d.cameras ?? [];
        setCameras(cams);
        setSelected((current) => current ?? cams.find((cam) => cam.available)?.cam_id ?? cams[0]?.cam_id ?? null);
        setLoading(false);
      })
      .catch(() => {
        setError('Cannot reach camera API. Is the backend running?');
        setLoading(false);
      });
  }, [apiBase]);

  // Keep a valid selected camera when the API camera list changes.
  useEffect(() => {
    if (cameras.length === 0) return;

    const currentStillExists = selected && cameras.some((cam) => cam.cam_id === selected);
    if (!currentStillExists) {
      const activeCam = cameras.find((cam) => cam.available)?.cam_id ?? cameras[0].cam_id;
      setSelected(activeCam);
      if (activeCam) triggerYoloSwitch(activeCam);
    }
  }, [cameras, selected]);

  const triggerYoloSwitch = async (camId: string) => {
    setSwitching(true);
    setStreamKey(Date.now());
    try {
      await fetch(`${yoloBase}/switch/${camId}`, { method: 'POST' });
      // Sync speed too
      await fetch(`${yoloBase}/speed/${speed}`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to switch camera on YOLO server:', err);
    } finally {
      setTimeout(() => setSwitching(false), 300);
    }
  };

  const handleCameraChange = (camId: string) => {
    setSelected(camId);
    triggerYoloSwitch(camId);
  };

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    setStreamKey(Date.now());
    if (!selected) return;
    try {
      await fetch(`${apiBase}/simulation/simulation/speed?speed=${newSpeed}`, { method: 'POST' }).catch(() => {});
      // Wait, let's call the correct path:
      await fetch(`${apiBase}/simulation/speed?speed=${newSpeed}`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to change simulation speed:', err);
    }
  };

  const handleRestartSimulation = async () => {
    if (!selected) return;
    try {
      await fetch(`${apiBase}/simulation/start?speed=${speed}&cam_id=${selected}`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to restart simulation:', err);
    }
  };

  const visibleCameras = cameras;
  const selectedCamera = selected ? cameras.find((cam) => cam.cam_id === selected) : undefined;
  const dynamicZones = selectedCamera?.zones
    ? Object.keys(selectedCamera.zones).map((zoneName) => ({
        name: formatZoneName(zoneName),
        color: ZONE_COLORS[zoneName] ?? '#94a3b8',
      }))
    : [];
  const currentCamConfig = selected
    ? {
        label: selectedCamera?.type ?? CAM_ZONES_CONFIG[selected]?.label,
        zones: dynamicZones.length > 0 ? dynamicZones : CAM_ZONES_CONFIG[selected]?.zones ?? [],
      }
    : null;
  const selectedLabel = selected
    ? CAM_LABELS[selected] ?? selectedCamera?.description ?? selectedCamera?.name ?? selected
    : '';
  const yoloCamId = yoloStats?.cam_id?.toUpperCase();
  const selectedCamId = selected?.toUpperCase();
  const useLocalYoloStream = false;
  const streamSrc = selected
  ? `${apiBase}/cameras/stream/${selected}?speed=${speed}&t=${streamKey}`
  : '';

  if (loading) {
    return (
      <div className="cam-loading">
        <div className="cam-spinner" />
        <span>Connecting to camera feeds...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cam-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="cam-feed-layout">
      {/* Premium Toggle Bar */}
      <div className="cam-control-header">
        <div className="cam-title-badge">
          <span className="ai-badge-dot animate-pulse" />
          <span className="ai-badge-text">⚡ YOLOv8 LIVE CV STREAM</span>
        </div>

        {yoloOnline && (
          <div className="cam-speed-selector">
            <span className="speed-label">Live Sync & Speed:</span>
            <button
              onClick={handleRestartSimulation}
              className="speed-btn restart-btn"
              title="Reset database and sync playback from the beginning"
              style={{ marginRight: '12px', border: '1px dashed #00ffc8', color: '#00ffc8' }}
            >
              🔄 Sync & Restart
            </button>
            {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main player + Telemetry panel layout */}
      <div className="cam-display-container">
        <div className="cam-main-player">
          {switching && (
            <div className="cam-switching-overlay">
              <div className="cam-spinner" />
              <span>Switching YOLO inference stream...</span>
            </div>
          )}

          {!streamError ? (
            <div className="cam-video-wrap">
              <div className={`cam-overlay-badge live ${useLocalYoloStream ? 'local' : 'simulated'}`}>
                <span className="cam-live-dot green-pulse" />
                {useLocalYoloStream ? 'YOLO LIVE (LOCAL)' : 'REAL CCTV FOOTAGE'}
              </div>
              <div className="cam-overlay-label">
                <span className="cam-overlay-icon">⚡</span>
                {selectedLabel}
                <span className="cam-overlay-zone">AI-Powered</span>
              </div>
              <img
                key={`${selected}-${useLocalYoloStream ? 'yolo' : 'recording'}-${streamKey}`}
                src={streamSrc}
                alt={`${selectedLabel} CCTV stream`}
                className="cam-video-el img-stream"
                onError={() => {
                  if (useLocalYoloStream) {
                    setYoloOnline(false);
                  } else {
                    setStreamError(true);
                  }
                }}
              />
            </div>
          ) : (
            <div className="cam-no-signal yolo-offline">
              <div className="yolo-offline-card">
                <h3>⚡ YOLO AI Inference Server Offline</h3>
                <p>Start the YOLO detection stream server to view real-time bounding boxes, track IDs, and zone polygon overlays:</p>
                <code>python detection_stream.py --cam {selected || 'CAM_1'} --speed {speed} --port 8001</code>
                
                <div style={{ marginTop: '20px', marginBottom: '15px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                    YOLO Server URL (e.g. ngrok HTTPS URL for Vercel):
                  </label>
                  <input
                    type="text"
                    value={yoloBase}
                    onChange={(e) => {
                      setYoloBase(e.target.value);
                      localStorage.setItem('yolo_base_url', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#1a1a26',
                      border: '1px solid #2a2a3d',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '0.9rem',
                    }}
                    placeholder="http://localhost:8001"
                  />
                </div>

                <button className="retry-btn" onClick={() => { setStreamError(false); triggerYoloSwitch(selected || 'CAM_1'); }}>
                  Retry Connection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Sidebar */}
        {useLocalYoloStream && (
          <div className="cam-telemetry-sidebar">
            <div className="sidebar-section">
              <div className="section-title">Model Specifications</div>
              <div className="spec-grid">
                <div className="spec-label">Detector:</div>
                <div className="spec-val cyan">YOLOv8n (Nano)</div>
                <div className="spec-label">Tracker:</div>
                <div className="spec-val cyan">ByteTrack</div>
                <div className="spec-label">Classes:</div>
                <div className="spec-val">Person [class_id: 0]</div>
                <div className="spec-label">Hardware:</div>
                <div className="spec-val green">CPU/GPU Inference</div>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-title">Real-Time Telemetry</div>
              <div className="telemetry-grid">
                <div className="telemetry-card">
                  <div className="card-lbl">Person Count</div>
                  <div className="card-val pulse-val">{yoloStats?.people ?? 0}</div>
                  <div className="card-sub">Current detections</div>
                </div>
                <div className="telemetry-card">
                  <div className="card-lbl">Inference Speed</div>
                  <div className={`card-val ${yoloStats && yoloStats.fps > 20 ? 'fps-fast' : 'fps-slow'}`}>
                    {yoloStats?.fps ?? 0} <span className="fps-unit">FPS</span>
                  </div>
                  <div className="card-sub">Strided processing (2/1)</div>
                </div>
              </div>
              <div className="frame-counter">
                <span>Processed Frames:</span>
                <span className="frame-no">{yoloStats?.frame ?? 0}</span>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-title">Active Overlays ({currentCamConfig?.zones.length ?? 0})</div>
              <div className="overlay-list">
                {currentCamConfig?.zones.map((zone) => (
                  <div key={zone.name} className="overlay-item">
                    <span className="zone-color-dot" style={{ backgroundColor: zone.color }} />
                    <span className="zone-name">{zone.name}</span>
                    <span className="zone-badge">Active Polygon</span>
                  </div>
                ))}
                {selected && (selected === 'CAM_1' || selected === 'CAM_4') && (
                  <div className="overlay-item">
                    <span className="zone-color-dot" style={{ backgroundColor: '#00ffc8' }} />
                    <span className="zone-name">Entry Crossing Line</span>
                    <span className="zone-badge">Line Crossing</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera thumbnail grid */}
      <div className="cam-thumb-grid">
        {visibleCameras
          .map((cam) => (
            <button
              key={cam.cam_id}
              className={`cam-thumb ${selected === cam.cam_id ? 'active' : ''} ${!cam.available ? 'offline' : ''}`}
              onClick={() => cam.available && handleCameraChange(cam.cam_id)}
              title={cam.available ? `Switch to ${CAM_LABELS[cam.cam_id] ?? cam.description ?? cam.name}` : 'Feed unavailable'}
            >
              <div className="cam-thumb-inner">
                <div className={`cam-thumb-placeholder ${cam.available ? 'active-indicator' : 'offline'}`}>
                  {cam.available ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>📵</span>
                  )}
                </div>
              </div>
              <div className="cam-thumb-label">
                <span className={`cam-thumb-status-dot ${cam.available ? 'online' : 'offline'}`} />
                {CAM_LABELS[cam.cam_id] ?? cam.description ?? cam.name}
              </div>
            </button>
          ))}
      </div>

      <div className="footage-detail-panel">
        <div className="footage-detail-title">Footage Details</div>
        <div className="footage-detail-list">
          {visibleCameras.map((cam) => {
            const label = CAM_LABELS[cam.cam_id] ?? cam.description ?? cam.name;
            const zoneCount = cam.zones ? Object.keys(cam.zones).length : 0;
            return (
              <button
                key={`${cam.cam_id}-detail`}
                type="button"
                className={`footage-detail-row ${selected === cam.cam_id ? 'active' : ''}`}
                onClick={() => cam.available && handleCameraChange(cam.cam_id)}
                disabled={!cam.available}
              >
                <span className="footage-detail-id">{cam.cam_id}</span>
                <span className="footage-detail-copy">
                  <strong>{label}</strong>
                  <small>
                    File: {cam.filename || 'Not found'} · Type: {(CAM_TYPE_LABELS[cam.cam_id] ?? cam.type ?? 'recording').replace(/_/g, ' ')} · Overlays: {zoneCount}
                  </small>
                </span>
                <span className={`footage-detail-state ${cam.available ? 'online' : 'offline'}`}>
                  {cam.available ? 'Available' : 'Missing'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
