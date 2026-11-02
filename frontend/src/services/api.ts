import {
  SystemTelemetry, NormalizedEvent, DetectionRecord, IncidentRecord,
  AttackGraphPayload, ForwardReachabilityResult, RuleValidationResult,
  TelemetryCoverageResponse
} from '../types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Health & Telemetry
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
  getTelemetry: async (): Promise<SystemTelemetry> => {
    const res = await fetch(`${API_BASE}/system/telemetry`);
    return res.json();
  },

  // Events & Ingestion
  getEvents: async (limit = 100, offset = 0, host?: string, user?: string): Promise<NormalizedEvent[]> => {
    let url = `${API_BASE}/events?limit=${limit}&offset=${offset}`;
    if (host) url += `&host=${encodeURIComponent(host)}`;
    if (user) url += `&user=${encodeURIComponent(user)}`;
    const res = await fetch(url);
    return res.json();
  },
  uploadLogs: async (file: File, sourceHint = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_hint', sourceHint);
    const res = await fetch(`${API_BASE}/ingestion/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  uploadLogFile: async (file: File, sourceHint = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_hint', sourceHint);
    const res = await fetch(`${API_BASE}/ingestion/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  getIngestionRuns: async () => {
    const res = await fetch(`${API_BASE}/ingestion/runs`);
    return res.json();
  },

  // Detections & Incidents
  getDetections: async (incidentId?: string, limit = 100): Promise<DetectionRecord[]> => {
    let url = incidentId ? `${API_BASE}/detections?incident_id=${incidentId}&limit=${limit}` : `${API_BASE}/detections?limit=${limit}`;
    const res = await fetch(url);
    return res.json();
  },
  getIncidents: async (): Promise<IncidentRecord[]> => {
    const res = await fetch(`${API_BASE}/incidents`);
    return res.json();
  },
  getIncident: async (incidentId: string): Promise<IncidentRecord> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
    return res.json();
  },
  getIncidentTimeline: async (incidentId: string) => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/timeline`);
    return res.json();
  },
  getIncidentGraph: async (incidentId: string, includeExposure = true): Promise<AttackGraphPayload> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/graph?include_exposure=${includeExposure}`);
    return res.json();
  },
  getIncidentEvidence: async (incidentId: string) => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/evidence`);
    return res.json();
  },

  // Forward Reachability Exposure
  getExposure: async (incidentId: string): Promise<ForwardReachabilityResult> => {
    const res = await fetch(`${API_BASE}/exposure/${incidentId}`);
    return res.json();
  },
  getForwardReachability: async (incidentId: string): Promise<ForwardReachabilityResult> => {
    const res = await fetch(`${API_BASE}/exposure/${incidentId}`);
    return res.json();
  },

  // Live Simulation Controls
  startSimulation: async (scenario = 'scenario_1', rate = 4) => {
    const res = await fetch(`${API_BASE}/simulation/start?scenario=${scenario}&rate=${rate}`, { method: 'POST' });
    return res.json();
  },
  pauseSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },
  resumeSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
    return res.json();
  },
  stopSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
    return res.json();
  },
  resetSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return res.json();
  },
  getSimulationStatus: async () => {
    const res = await fetch(`${API_BASE}/simulation/status`);
    return res.json();
  },

  // Validation Lab & Telemetry Coverage
  getRules: async () => {
    const res = await fetch(`${API_BASE}/validation/rules`);
    return res.json();
  },
  runValidation: async (): Promise<RuleValidationResult[]> => {
    const res = await fetch(`${API_BASE}/validation/run`, { method: 'POST' });
    return res.json();
  },
  getTelemetryCoverage: async (): Promise<TelemetryCoverageResponse> => {
    const res = await fetch(`${API_BASE}/telemetry/coverage`);
    return res.json();
  },

  // Evaluation & Reports
  getEvaluationMetrics: async (scenario = 'scenario_1') => {
    const res = await fetch(`${API_BASE}/evaluation/metrics?scenario=${scenario}`);
    return res.json();
  },
  runEvaluation: async (scenario = 'scenario_1') => {
    const res = await fetch(`${API_BASE}/evaluation/metrics?scenario=${scenario}`);
    return res.json();
  },
  runBenchmark: async (tier = 'Core (15 GB)') => {
    const res = await fetch(`${API_BASE}/evaluation/benchmark?tier=${encodeURIComponent(tier)}`, { method: 'POST' });
    return res.json();
  },
  runScaleBenchmark: async (tier = 'Core (15 GB)') => {
    const res = await fetch(`${API_BASE}/evaluation/benchmark?tier=${encodeURIComponent(tier)}`, { method: 'POST' });
    return res.json();
  },
  getIncidentReport: async (incidentId: string) => {
    const res = await fetch(`${API_BASE}/reports/${incidentId}`);
    return res.json();
  },
};
