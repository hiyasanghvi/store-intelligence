import React, { useEffect, useMemo, useState } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
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
  const showYoloStream = isLocalBrowser && !streamError;
  const sourceLabel = showYoloStream
    ? 'Local YOLO stream'
    : 'Bundled CCTV clip';

  useEffect(() => {
    if (!isLocalBrowser || streamError) return;
    const timeout = window.setTimeout(() => setStreamError(true), 7000);
    return () => window.clearTimeout(timeout);
  }, [isLocalBrowser, selectedId, streamError]);

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
          <span className="ai-badge-text">LIVE YOLO CCTV</span>
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
            {showYoloStream ? 'YOLO DETECTION LIVE' : 'REAL CCTV PREVIEW'}
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
              key={`${selectedId}-preview`}
              src={previewSrc(selectedId)}
              className="cam-video-el img-stream"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          )}
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
