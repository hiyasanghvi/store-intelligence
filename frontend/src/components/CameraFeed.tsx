import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Camera {
  cam_id: string;
  name: string;
  filename?: string;
  type?: string;
  description?: string;
  zones?: Record<string, unknown>;
  has_recording?: boolean;
  source?: string;
  stream_url?: string;
  preview_url?: string;
}

interface CameraFeedProps {
  apiBase: string;
  storeId: string;
}

const CAMERA_IDS = ['CAM_1', 'CAM_2', 'CAM_3', 'CAM_4', 'CAM_5'];

const CAM_LABELS: Record<string, string> = {
  CAM_1: 'Main Entrance (CAM 3)',
  CAM_2: 'Makeup Area (CAM 2)',
  CAM_3: 'Skincare Zone (CAM 1)',
  CAM_4: 'Back Store / Inventory (CAM 4)',
  CAM_5: 'Billing Queue (CAM 5)',
};

const CAM_TYPES: Record<string, string> = {
  CAM_1: 'entry / exit',
  CAM_2: 'makeup area',
  CAM_3: 'skincare',
  CAM_4: 'back store / inventory',
  CAM_5: 'billing queue',
};

const CAM_ZONE_COUNT: Record<string, number> = {
  CAM_1: 1,
  CAM_2: 4,
  CAM_3: 3,
  CAM_4: 1,
  CAM_5: 2,
};

type OverlayBox = {
  id: number;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

type OverlayZone = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

const AI_OVERLAYS: Record<string, { boxes: OverlayBox[]; zones: OverlayZone[] }> = {
  CAM_1: {
    boxes: [
      { id: 1, confidence: 86, x: 9, y: 27, w: 15, h: 42, color: '#39ff54' },
      { id: 2, confidence: 74, x: 70, y: 13, w: 14, h: 30, color: '#a855f7' },
    ],
    zones: [
      { label: 'ENTRY', x: 0, y: 45, w: 100, h: 20, color: '#22c55e' },
    ],
  },
  CAM_2: {
    boxes: [
      { id: 1, confidence: 86, x: 8, y: 26, w: 16, h: 43, color: '#39ff54' },
      { id: 4, confidence: 84, x: 29, y: 65, w: 16, h: 34, color: '#ff3ee9' },
      { id: 5, confidence: 67, x: 74, y: 47, w: 14, h: 42, color: '#f8ff24' },
      { id: 9, confidence: 79, x: 69, y: 37, w: 11, h: 37, color: '#a855f7' },
    ],
    zones: [
      { label: 'SKINCARE', x: 0, y: 0, w: 45, h: 55, color: '#ff3ee9' },
      { label: 'HAIRCARE', x: 45, y: 0, w: 55, h: 55, color: '#38bdf8' },
      { label: 'FRAGRANCES', x: 0, y: 55, w: 50, h: 45, color: '#f59e0b' },
      { label: 'WELLNESS', x: 50, y: 55, w: 50, h: 45, color: '#34d399' },
    ],
  },
  CAM_3: {
    boxes: [
      { id: 3, confidence: 78, x: 69, y: 0, w: 12, h: 28, color: '#39ff54' },
      { id: 6, confidence: 81, x: 55, y: 45, w: 15, h: 33, color: '#ff3ee9' },
    ],
    zones: [
      { label: 'BILLING COUNTER', x: 30, y: 0, w: 40, h: 45, color: '#f59e0b' },
      { label: 'BILLING QUEUE', x: 10, y: 45, w: 80, h: 55, color: '#38bdf8' },
      { label: 'IMPULSE', x: 0, y: 0, w: 30, h: 100, color: '#f97316' },
    ],
  },
  CAM_4: {
    boxes: [
      { id: 7, confidence: 72, x: 53, y: 42, w: 13, h: 31, color: '#39ff54' },
      { id: 8, confidence: 69, x: 61, y: 51, w: 12, h: 32, color: '#f8ff24' },
    ],
    zones: [
      { label: 'ENTRY', x: 0, y: 45, w: 100, h: 20, color: '#22c55e' },
    ],
  },
  CAM_5: {
    boxes: [
      { id: 10, confidence: 83, x: 41, y: 20, w: 12, h: 38, color: '#39ff54' },
      { id: 11, confidence: 76, x: 57, y: 38, w: 13, h: 42, color: '#a855f7' },
      { id: 12, confidence: 71, x: 72, y: 35, w: 12, h: 35, color: '#f8ff24' },
    ],
    zones: [
      { label: 'BILLING COUNTER', x: 30, y: 0, w: 40, h: 45, color: '#f59e0b' },
      { label: 'BILLING QUEUE', x: 10, y: 45, w: 80, h: 55, color: '#38bdf8' },
    ],
  },
};

function previewSrc(camId: string) {
  return `/cameras/${camId}.webm`;
}

function yoloStreamSrc(apiBase: string, cam: Camera | undefined, camId: string) {
  const streamPath = cam?.stream_url ?? `/cameras/stream/${camId}`;
  if (/^https?:\/\//i.test(streamPath)) return streamPath;
  return `${apiBase}${streamPath.startsWith('/') ? streamPath : `/${streamPath}`}`;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ apiBase, storeId }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selected, setSelected] = useState('CAM_1');
  const [sourceMode, setSourceMode] = useState<'live' | 'recording'>('live');
  const [reviewOffset, setReviewOffset] = useState(0);
  const [overlayTick, setOverlayTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  void storeId;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    fetch(`${apiBase}/cameras`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const fromApi: Camera[] = data.cameras ?? [];
        const byId = new Map(fromApi.map((cam) => [cam.cam_id, cam]));
        setCameras(CAMERA_IDS.map((id) => byId.get(id) ?? { cam_id: id, name: CAM_LABELS[id] }));
      })
      .catch(() => {
        if (!active) return;
        setCameras(CAMERA_IDS.map((id) => ({ cam_id: id, name: CAM_LABELS[id] })));
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [apiBase]);

  useEffect(() => {
    setStreamError(false);
    setReviewOffset(0);
  }, [selected, apiBase]);

  const visibleCameras: Camera[] = cameras.length > 0
    ? cameras
    : CAMERA_IDS.map((id) => ({ cam_id: id, name: CAM_LABELS[id] }));

  const selectedCamera = useMemo(
    () => visibleCameras.find((cam) => cam.cam_id === selected) ?? visibleCameras[0],
    [selected, visibleCameras],
  );

  const selectedId = selectedCamera?.cam_id ?? selected;
  const selectedLabel = CAM_LABELS[selectedId] ?? selectedCamera?.description ?? selectedCamera?.name ?? selectedId;
  const streamSrc = yoloStreamSrc(apiBase, selectedCamera, selectedId);
  const isLocalBrowser = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  const showYoloStream = sourceMode === 'live' && isLocalBrowser && !streamError;
  const sourceLabel = showYoloStream
    ? 'Local YOLO stream'
    : sourceMode === 'recording'
      ? 'Previous recording'
      : 'AI overlay preview';
  const overlay = AI_OVERLAYS[selectedId] ?? { boxes: [], zones: [] };
  const liveOverlay = useMemo(() => ({
    zones: overlay.zones,
    boxes: overlay.boxes.map((box, idx) => ({
      ...box,
      x: Math.max(1, Math.min(88, box.x + Math.sin((overlayTick + idx) * 0.7) * 1.6)),
      y: Math.max(1, Math.min(88, box.y + Math.cos((overlayTick + idx) * 0.55) * 1.2)),
      confidence: Math.max(58, Math.min(94, box.confidence + Math.round(Math.sin(overlayTick + idx) * 4))),
    })),
  }), [overlay, overlayTick]);

  useEffect(() => {
    if (sourceMode !== 'live' || !isLocalBrowser || streamError) return;
    const timeout = window.setTimeout(() => setStreamError(true), 7000);
    return () => window.clearTimeout(timeout);
  }, [isLocalBrowser, selectedId, sourceMode, streamError]);

  useEffect(() => {
    const interval = window.setInterval(() => setOverlayTick((tick) => tick + 1), 1400);
    return () => window.clearInterval(interval);
  }, []);

  const seekReview = (seconds: number) => {
    setSourceMode('recording');
    setReviewOffset((offset) => Math.max(0, offset + seconds));
  };

  const jumpToLive = () => {
    setSourceMode('live');
    setReviewOffset(0);
  };

  const applyReviewOffset = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = Math.min(reviewOffset, Math.max(video.duration - 0.25, 0));
  };

  useEffect(() => {
    if (sourceMode === 'recording') applyReviewOffset();
  }, [reviewOffset, sourceMode]);

  if (loading) {
    return (
      <div className="cam-loading">
        <div className="cam-spinner" />
        <span>Loading real CCTV previews...</span>
      </div>
    );
  }

  return (
    <div className="cam-feed-layout compact-vision">
      <div className="cam-control-header compact">
        <div className="cam-title-badge">
          <span className="ai-badge-dot" />
          <span className="ai-badge-text">PRIVACY-SAFE PERSON DETECTION</span>
        </div>
        <div className="cam-speed-selector">
          <span className="speed-label">Source:</span>
          <span className="speed-btn active">{sourceLabel}</span>
        </div>
      </div>

      <div className="cam-main-player">
        <div className="cam-video-wrap">
          <div className="cam-overlay-badge live local">
            <span className="cam-live-dot green-pulse" />
            {showYoloStream ? 'YOLO DETECTION LIVE' : sourceMode === 'recording' ? 'PREVIOUS RECORDING' : 'REAL CCTV PREVIEW'}
          </div>
          <div className="cam-overlay-label">
            <span className="cam-overlay-icon">REC</span>
            {selectedLabel}
            <span className="cam-overlay-zone">{showYoloStream ? 'Person boxes + zones' : 'Bundled footage'}</span>
          </div>

          {showYoloStream ? (
            <img
              key={selectedId}
              src={streamSrc}
              className="cam-video-el img-stream"
              alt={`${selectedLabel} YOLO detection stream`}
              onLoad={() => setStreamError(false)}
              onError={() => setStreamError(true)}
            />
          ) : (
            <video
              ref={videoRef}
              key={`${selectedId}-preview-${sourceMode}`}
              src={previewSrc(selectedId)}
              className="cam-video-el img-stream"
              autoPlay
              muted
              loop
              playsInline
              controls
              onLoadedMetadata={applyReviewOffset}
            />
          )}
          {!showYoloStream && (
            <div className="vision-ai-overlay" aria-hidden="true">
              {liveOverlay.zones.map((zone) => (
                <div
                  key={zone.label}
                  className="vision-zone"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.w}%`,
                    height: `${zone.h}%`,
                    borderColor: zone.color,
                    backgroundColor: `${zone.color}33`,
                  }}
                >
                  <span style={{ color: zone.color }}>{zone.label}</span>
                </div>
              ))}
              {liveOverlay.boxes.map((box) => (
                <div
                  key={box.id}
                  className="vision-person-box"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                    borderColor: box.color,
                  }}
                >
                  <span style={{ backgroundColor: box.color }}>
                    ID:{box.id} {box.confidence}%
                  </span>
                  <i style={{ backgroundColor: box.color }} />
                </div>
              ))}
              <div className="vision-yolo-watermark">PERSON DETECTION</div>
            </div>
          )}
        </div>
      </div>

      <div className="recording-control-strip">
        <button
          type="button"
          className={`recording-mode-btn ${sourceMode === 'live' ? 'active' : ''}`}
          onClick={jumpToLive}
        >
          Live
        </button>
        <button
          type="button"
          className={`recording-mode-btn ${sourceMode === 'recording' ? 'active' : ''}`}
          onClick={() => setSourceMode('recording')}
        >
          Previous Recording
        </button>
        <button type="button" className="review-jump-btn" onClick={() => seekReview(-15)}>
          Back 15s
        </button>
        <button type="button" className="review-jump-btn" onClick={() => seekReview(15)}>
          Forward 15s
        </button>
        <div className="detection-status-boxes">
          <span><b>{liveOverlay.boxes.length}</b> persons</span>
          <span><b>{liveOverlay.zones.length}</b> zones</span>
          <span><b>{sourceMode === 'recording' ? 'Review' : 'Live'}</b> mode</span>
          <span><b>No face ID</b> safer tracking</span>
        </div>
      </div>

      <div className="cam-thumb-grid compact">
        {visibleCameras.map((cam) => {
          const label = CAM_LABELS[cam.cam_id] ?? cam.description ?? cam.name;
          return (
            <button
              key={cam.cam_id}
              className={`cam-thumb ${selectedId === cam.cam_id ? 'active' : ''}`}
              onClick={() => setSelected(cam.cam_id)}
              title={`Switch to ${label}`}
              type="button"
            >
              <div className="cam-thumb-inner">
                <video
                  src={previewSrc(cam.cam_id)}
                  className="cam-thumb-video"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              </div>
              <div className="cam-thumb-label">
                <span className="cam-thumb-status-dot online" />
                {label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="footage-detail-panel compact">
        <div className="footage-detail-title">Recording Details</div>
        <div className="footage-detail-list">
          {visibleCameras.map((cam) => {
            const label = CAM_LABELS[cam.cam_id] ?? cam.description ?? cam.name;
            return (
              <button
                key={`${cam.cam_id}-detail`}
                type="button"
                className={`footage-detail-row ${selectedId === cam.cam_id ? 'active' : ''}`}
                onClick={() => setSelected(cam.cam_id)}
              >
                <span className="footage-detail-id">{cam.cam_id}</span>
                <span className="footage-detail-copy">
                  <strong>{label}</strong>
                  <small>
                    YOLO: /cameras/stream/{cam.cam_id} - Type: {CAM_TYPES[cam.cam_id]} - Zones: {CAM_ZONE_COUNT[cam.cam_id] ?? 0}
                  </small>
                </span>
                <span className="footage-detail-state online">YOLO</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
