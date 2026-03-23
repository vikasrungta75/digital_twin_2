/**
 * dashcamService.ts  (FIXED for Vercel deployment)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix summary:
 *   1. IOT_BASE and API_BASE dynamically switch between direct URL (localhost)
 *      and Vercel proxy path (/iot-proxy) in production
 *   2. resolveStreamUrls rewriteToPublic also uses proxy in production
 *   3. All other logic unchanged
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

// ─── Config ───────────────────────────────────────────────────────────────────
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const IOT_BASE = isProduction ? '' : 'https://iot.ravity.io';
const API_BASE = isProduction ? '/iot-proxy/api/v3' : 'https://iot.ravity.io/api/v3';
const TOKEN = process.env.REACT_APP_IOT_TOKEN || '';

const api = () =>
  axios.create({
    baseURL: API_BASE,
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });

// Proxy instance — routes through CRA dev proxy (/iot-api → iot.ravity.io/api/v3)
const proxyApi = () =>
  axios.create({
    baseURL: '/iot-api',
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });

// ─── API Response wrapper (code 1000 = success) ───────────────────────────────
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// ─── Shared pagination result ─────────────────────────────────────────────────
export interface PagedData<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  size: number;
}

const parsePaged = <T>(raw: any, size: number): PagedData<T> => {
  const d = raw?.pageResult ?? raw;
  return {
    data: d?.data ?? d?.records ?? d?.list ?? [],
    total: d?.total ?? 0,
    totalPages: d?.totalPages ?? d?.pages ?? Math.ceil((d?.total ?? 0) / size),
    page: d?.page ?? 1,
    size,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const resolveMediaUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${isProduction ? 'https://iot.ravity.io' : IOT_BASE}${path}`;
};

// ─── Types: Device ────────────────────────────────────────────────────────────
export interface IotDevice {
  id: number;
  imei: string;
  deviceName: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  gatewayId: number;
  gatewayName: string;
  protocol: string;
  status: number;
  importTime: number;
  remark?: string;
  onlineStatus: number;
}

export interface IotChannelCount {
  imei: string;
  channelCount: number;
}

// ─── Types: Gateway ───────────────────────────────────────────────────────────
export interface IotGateway {
  id: number;
  name: string;
  gatewayCode: string;
  protocol: string;
  port: number;
  hostname: string;
  status: string;
  startTime: number;
  connectionCount: number;
  onlineCount: number;
  description?: string;
  uptime?: string;
}

// ─── Types: Alert + Attachment ────────────────────────────────────────────────
export interface IotAttachment {
  id: number;
  imei: string;
  channel: number;
  mediaType: number;
  fileName: string;
  fileSize: number;
  storagePath: string;
  captureTime: number;
  duration: number;
  createdAt: number;
  updatedAt: number;
  calc: number;
  storageChannel: number;
}

export interface IotAlert {
  id: number;
  imei: string;
  deviceName?: string;
  alertTypeCode?: string;
  type?: string;
  alertName?: string;
  alarmType?: string;
  eventType?: string;
  triggerType?: string;
  firingStatus?: string;
  fring_status?: string;
  alertTime: number;
  details?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  locationAddress?: string;
  extraInfo?: string;
  status: number;
  handledBy?: number;
  handledAt?: number;
  handleNote?: string;
  userId?: number;
  createdAt: number;
  updatedAt: number;
  alarmLabel?: string;
  description?: string;
  attachment?: IotAttachment[];
}

// ─── Types: Resource ──────────────────────────────────────────────────────────
export interface IotResource {
  id: number;
  userId?: number;
  imei: string;
  channel: number;
  mediaType: number;
  fileName: string;
  fileSize: number;
  storagePath: string;
  captureTime: number;
  duration?: number;
  createdAt: number;
  updatedAt: number;
  eventType?: string;
  calc?: number;
  storageChannel?: number;
  deviceName?: string;
}

// ─── Types: Video Streaming ───────────────────────────────────────────────────
export interface StreamingUrls {
  rtmp: string;
  flv: string;
  hls: string;
}

export interface LiveVideoSession {
  resultCode: string;
  resultMsg: string | null;
  /** Internal HTTP URLs — NOT for browser use. Use streamingSslUrls instead. */
  streamingUrls: StreamingUrls;
  /** Public HTTPS URLs — USE THESE in the browser. */
  streamingSslUrls: StreamingUrls;
  streamUrl?: string;
  imei?: string;
  channel?: number;
}

export interface VideoFile {
  fileName: string;
  startTime: string;
  endTime: string;
  fileSize: number;
  channel: number;
  dataType: number;
  storageType: number;
}

export interface PlaybackSession {
  streamingUrls: StreamingUrls;
  streamingSslUrls?: StreamingUrls;
  fileList: string[];
}

// ─── Types: Command ───────────────────────────────────────────────────────────
export interface CommandResult {
  resultCode: string;
  resultMsg: string;
  imei?: string;
  cmdNo?: string;
  content?: string;
}

export interface CommandHistory {
  id: number;
  imei: string;
  content: string;
  isManual: string;
  sync: boolean;
  status: number;
  response?: string;
  userId?: number;
  sentAt: number;
  responseAt?: number;
  createdAt: number;
  updatedAt?: number;
  cmdNo: string;
}

// ─── Types: Track ─────────────────────────────────────────────────────────────
export interface TrackPoint {
  deviceTime: string;
  latitude: number;
  longitude: number;
  gpsSpeed: number;
  direction: number;
  acc: number;
  satelliteNum: number;
  postMethod: number;
  altitude: number;
  distance: number;
}

export interface TrackData {
  tracks: TrackPoint[];
  currentPageSize: number;
  hasNext: boolean;
  nextPageState: string;
}

// ─── Types: OBD ───────────────────────────────────────────────────────────────
export interface OBDPoint {
  deviceTime: string;
  latitude: number;
  longitude: number;
  accStatus: number;
  vehicleSpeed: number;
  engineSpeed: number;
  fuelLevel: number;
  batteryVoltage: number;
  coolantTemp: number;
  throttle: number;
  odometer: number;
  cumulativeMileage: number;
}

export interface OBDData {
  obdData: OBDPoint[];
  currentPageSize: number;
  hasNext: boolean;
  nextPageState: string;
}

// ─── Types: Storage ───────────────────────────────────────────────────────────
export interface StorageUsage {
  usedSpace: string;
  totalSpace: number;
  usagePercentage: number;
}

// =============================================================================
// DEVICE APIs
// =============================================================================

export const fetchDevices = async (
  page = 1,
  size = 50,
  params: {
    keyword?: string;
    deviceType?: string;
    manufacturer?: string;
    model?: string;
    protocol?: string;
    importTimeStart?: number;
    importTimeEnd?: number;
  } = {}
): Promise<PagedData<IotDevice>> => {
  const res = await api().get<ApiResponse<any>>('/devices/page', {
    params: { page, size, ...params },
  });
  return parsePaged<IotDevice>(res.data?.data, size);
};

export const fetchDeviceById = async (id: number): Promise<IotDevice> => {
  const res = await api().get<ApiResponse<IotDevice>>(`/devices/${id}`);
  return res.data.data;
};

export const fetchChannelCount = async (imei: string): Promise<IotChannelCount> => {
  const res = await api().get<ApiResponse<IotChannelCount>>(`/devices/channel/${imei}`);
  return res.data.data;
};

export const updateDevice = async (id: number, deviceName: string): Promise<IotDevice> => {
  const res = await api().put<ApiResponse<IotDevice>>('/devices', { id, deviceName });
  return res.data.data;
};

export const importDevice = async (payload: {
  manufacturer: string;
  model: string;
  imei: string;
  deviceName?: string;
}): Promise<IotDevice> => {
  const res = await api().post<ApiResponse<IotDevice>>('/devices/import/single', payload);
  return res.data.data;
};

export const deleteDevices = async (imeis: string[]): Promise<void> => {
  await api().post('/devices/bulk', imeis);
};

export const deleteDevice = async (id: number): Promise<void> => {
  await api().delete(`/devices/${id}`);
};

// =============================================================================
// GATEWAY APIs
// =============================================================================

export const fetchGateways = async (page = 1, size = 10): Promise<PagedData<IotGateway>> => {
  const res = await api().get<ApiResponse<any>>('/gateways/page', { params: { page, size } });
  return parsePaged<IotGateway>(res.data?.data, size);
};

export const fetchGatewayList = async (): Promise<IotGateway[]> => {
  const res = await api().get<ApiResponse<IotGateway[]>>('/gateways/list');
  return res.data.data ?? [];
};

export const fetchGatewayById = async (id: number): Promise<IotGateway> => {
  const res = await api().get<ApiResponse<IotGateway>>(`/gateways/${id}`);
  return res.data.data;
};

// =============================================================================
// ALERT APIs
// =============================================================================

export const fetchAlerts = async (
  page = 1,
  size = 20,
  params: {
    keyword?: string;
    type?: string;
    startTime?: number;
    endTime?: number;
  } = {}
): Promise<PagedData<IotAlert>> => {
  const res = await api().get<ApiResponse<any>>('/alerts/page', {
    params: { page, size, ...params },
  });
  return parsePaged<IotAlert>(res.data?.data, size);
};

export const fetchAlertById = async (id: number): Promise<IotAlert> => {
  const res = await api().get<ApiResponse<IotAlert>>(`/alerts/${id}`);
  return res.data.data;
};

export const deleteAlert = async (id: number): Promise<void> => {
  await api().delete(`/alerts/${id}`);
};

export const saveAlertSetting = async (
  imei: string,
  alertCode: string,
  value: '0' | '1'
): Promise<void> => {
  await api().post('/alert/upload/settings', { imei, alertCode, value });
};

// =============================================================================
// RESOURCE APIs
// =============================================================================

export const fetchResources = async (
  page = 1,
  size = 20,
  params: {
    imei?: string;
    channel?: number;
    mediaType?: number;
    eventType?: string;
    keyword?: string;
    startTime?: number;
    endTime?: number;
  } = {}
): Promise<PagedData<IotResource>> => {
  const res = await api().get<ApiResponse<any>>('/resource/page', {
    params: { page, size, ...params },
  });
  return parsePaged<IotResource>(res.data?.data, size);
};

export const fetchResourceById = async (id: number): Promise<IotResource> => {
  const res = await api().get<ApiResponse<IotResource>>(`/resource/${id}`);
  return res.data.data;
};

export const deleteResource = async (id: number): Promise<void> => {
  await api().delete(`/resource/${id}`);
};

export const fetchStorageUsage = async (): Promise<StorageUsage> => {
  const res = await api().get<ApiResponse<StorageUsage>>('/resource/storage/usage');
  return res.data.data;
};

// =============================================================================
// VIDEO APIs
// =============================================================================

export const startLiveVideo = async (
  imei: string,
  channel: number,
  dataType: 'audio_video' | 'video_only' | 'monitor' = 'audio_video',
  streamType: 'main_stream' | 'sub_stream' = 'main_stream',
  cmdNo?: number
): Promise<LiveVideoSession> => {
  const res = await api().post<ApiResponse<LiveVideoSession>>(
    '/video/live/start',
    {
      imei,
      channel,
      dataType,
      streamType,
      ...(cmdNo !== undefined ? { cmdNo } : {}),
    },
    { validateStatus: () => true }
  );
  return res.data.data;
};

export const stopLiveVideo = async (
  imei: string,
  channel: number,
  cmdNo?: number
): Promise<void> => {
  await api().post(
    '/video/live/stop',
    {
      imei,
      channel,
      ...(cmdNo !== undefined ? { cmdNo } : {}),
    },
    { validateStatus: () => true }
  );
};

export const listVideoFiles = async (
  imei: string,
  startTime: number,
  endTime: number,
  channel = 1,
  cmdNo?: number
): Promise<{ files: VideoFile[]; totalCount: number }> => {
  const res = await api().post<ApiResponse<{ files: VideoFile[]; totalCount: number }>>(
    '/video/files/list',
    {
      imei,
      channel,
      startTime: String(startTime),
      endTime: String(endTime),
      dataType: 0,
      streamType: 0,
      storageType: 0,
      ...(cmdNo !== undefined ? { cmdNo } : {}),
    }
  );
  return res.data.data;
};

export const startVideoPlayback = async (
  imei: string,
  fileNames: string[],
  cmdNo?: number,
  playMethod = 0
): Promise<PlaybackSession> => {
  const res = await api().post<ApiResponse<PlaybackSession>>('/video/playback/start', {
    imei,
    fileNames,
    playMethod,
    forwardRewind: 1,
    ...(cmdNo !== undefined ? { cmdNo } : {}),
  });
  return res.data.data;
};

export const stopVideoPlayback = async (
  imei: string,
  channel = 1,
  cmdNo?: number
): Promise<void> => {
  await api().post('/video/playback/stop', {
    imei,
    channel,
    ...(cmdNo !== undefined ? { cmdNo } : {}),
  });
};

export const controlVideoPlayback = async (
  imei: string,
  playCtrl: 0 | 1 | 2 | 3 | 4 | 5,
  channel = 1,
  beginTime?: number,
  cmdNo?: number
): Promise<void> => {
  await api().post('/video/playback/control', {
    imei,
    channel,
    playCtrl,
    forwardRewind: 0,
    ...(beginTime !== undefined ? { beginTime: String(beginTime) } : {}),
    ...(cmdNo !== undefined ? { cmdNo } : {}),
  });
};

export const startCapture = async (
  imei: string,
  channel = 1,
  type: 1 | 2 | 3 = 1,
  options: { count?: number; duration?: number; photoCount?: number; cmdNo?: number } = {}
): Promise<CommandResult> => {
  const res = await api().post<ApiResponse<CommandResult>>('/video/capture/start', {
    imei,
    channel,
    type,
    count: options.count ?? 1,
    duration: options.duration ?? 5,
    photoCount: options.photoCount ?? 1,
    ...(options.cmdNo !== undefined ? { cmdNo: options.cmdNo } : {}),
  });
  return res.data.data;
};

export const startRemoteUpload = async (
  imei: string,
  fileNames: string[],
  channel = 1,
  cmdNo?: number
): Promise<CommandResult> => {
  const res = await api().post<ApiResponse<CommandResult>>('/video/upload/start', {
    imei,
    channel,
    fileNames,
    dataType: 0,
    streamType: 0,
    storageType: 0,
    ...(cmdNo !== undefined ? { cmdNo } : {}),
  });
  return res.data.data;
};

// =============================================================================
// COMMAND APIs
// =============================================================================

export const sendCommand = async (
  imei: string,
  content: string,
  options: {
    msgId?: string;
    sync?: boolean;
    offline?: boolean;
    timeout?: number;
    cmdNo?: number;
  } = {}
): Promise<CommandResult> => {
  const res = await api().post<ApiResponse<CommandResult>>('/command/send', {
    imei,
    content,
    sync: options.sync ?? true,
    offline: options.offline ?? true,
    timeout: options.timeout ?? 30,
    ...(options.msgId ? { msgId: options.msgId } : {}),
    ...(options.cmdNo !== undefined ? { cmdNo: options.cmdNo } : {}),
  });
  return res.data.data;
};

export const wakeupDevice = async (imei: string): Promise<CommandResult> => {
  const res = await api().post<ApiResponse<CommandResult>>('/command/wakeup', {
    imei, sync: true, offline: true, timeout: 30,
  });
  return res.data.data;
};

export const getCommandNumber = async (): Promise<number> => {
  const res = await api().post<ApiResponse<{ cmdNo: number }>>('/command/cmdNo');
  return res.data.data.cmdNo;
};

export const fetchCommandHistory = async (
  page = 1,
  size = 20,
  params: { imei?: string; status?: number; isManual?: boolean; startTime?: number; endTime?: number } = {}
): Promise<PagedData<CommandHistory>> => {
  const res = await api().get<ApiResponse<any>>('/command/history/page', {
    params: { page, size, ...params },
  });
  const d = res.data?.data;
  return {
    data: d?.list ?? [],
    total: d?.total ?? 0,
    totalPages: d?.totalPages ?? Math.ceil((d?.total ?? 0) / size),
    page: d?.page ?? 1,
    size,
  };
};

export const fetchDeviceCommandHistory = async (
  imei: string,
  limit = 20
): Promise<CommandHistory[]> => {
  const res = await api().get<ApiResponse<CommandHistory[]>>(
    `/command/history/device/${imei}`,
    { params: { limit } }
  );
  return res.data.data ?? [];
};

// =============================================================================
// TRACK APIs
// =============================================================================

export const fetchTrack = async (
  imei: string,
  startTime: string,
  endTime: string,
  pageSize = 100,
  pagingState?: string
): Promise<TrackData> => {
  const res = await api().get<ApiResponse<TrackData>>('/track', {
    params: { imei, startTime, endTime, pageSize, ...(pagingState ? { pagingState } : {}) },
  });
  return res.data.data;
};

// =============================================================================
// OBD APIs
// =============================================================================

export const fetchOBD = async (
  imei: string,
  startTime: string,
  endTime: string,
  pageSize = 100,
  pagingState?: string
): Promise<OBDData> => {
  const res = await api().get<ApiResponse<OBDData>>('/obd', {
    params: { imei, startTime, endTime, pageSize, ...(pagingState ? { pagingState } : {}) },
  });
  return res.data.data;
};

// =============================================================================
// VENDOR / MODEL APIs
// =============================================================================

export const fetchVendors = async () => {
  const res = await api().get<ApiResponse<any[]>>('/vendors');
  return res.data.data ?? [];
};

export const fetchModels = async () => {
  const res = await api().get<ApiResponse<any[]>>('/models');
  return res.data.data ?? [];
};

export const fetchModelsByVendor = async (vendorId: number) => {
  const res = await api().get<ApiResponse<any[]>>(`/models/vendor/${vendorId}`);
  return res.data.data ?? [];
};

// =============================================================================
// UI HELPERS
// =============================================================================

export const alertHasVideo = (alert: IotAlert): boolean =>
  !!alert.attachment?.some(a => a.mediaType === 1);

export const alertHasMedia = (alert: IotAlert): boolean =>
  !!alert.attachment?.some(a => a.mediaType === 0 || a.mediaType === 1);

export const isDashcam = (device: IotDevice): boolean => {
  const type = (device.deviceType || '').toLowerCase();
  const model = (device.model || '').toUpperCase();
  const name = (device.deviceName || '').toLowerCase();
  return (
    type === 'dashcam' ||
    type.includes('camera') ||
    type.includes('dvr') ||
    type.includes('mdvr') ||
    model.startsWith('JC') ||
    name.includes('cam') ||
    name.includes('dvr')
  );
};

/**
 * resolveStreamUrls — unified helper to get browser-safe FLV + HLS URLs
 * from a LiveVideoSession.
 */
export const resolveStreamUrls = (
  session: LiveVideoSession | null | undefined
): { flvUrl: string; hlsUrl: string; rtmpUrl: string } => {
  if (!session) return { flvUrl: '', hlsUrl: '', rtmpUrl: '' };
  const ssl = session.streamingSslUrls;
  const plain = session.streamingUrls;

  const flvUrl = ssl?.flv || rewriteToPublic(plain?.flv || '');
  const hlsUrl = ssl?.hls || rewriteToPublic(plain?.hls || '');
  const rtmpUrl = ssl?.rtmp || plain?.rtmp || '';

  return { flvUrl, hlsUrl, rtmpUrl };
};

/**
 * Fallback rewriter: converts internal HTTP server IPs to the public endpoint.
 * In production uses Vercel proxy, in development uses direct iot.ravity.io.
 */
const rewriteToPublic = (url: string): string => {
  if (!url) return '';
  const publicBase = isProduction
    ? `${window.location.origin}/iot-proxy`
    : 'https://iot.ravity.io:8891';
  return url.replace(/^https?:\/\/[^/]+/, publicBase);
};
