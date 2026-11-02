export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SystemTelemetry {
  events_received: number;
  events_processed: number;
  events_per_second: number;
  suspicious_detections: number;
  active_incidents: number;
  critical_incidents: number;
  hosts_involved: number;
  users_involved: number;
  current_status: string;
  queue_backlog: number;
  dropped_events: number;
  cpu_percent: number;
  memory_percent: number;
  detection_latency_ms: number;
  correlation_latency_ms: number;
}

export interface NormalizedEvent {
  event_id: string;
  timestamp: string;
  ingestion_timestamp: string;
  source: string;
  source_type: string;
  host: string | null;
  user: string | null;
  source_ip: string | null;
  destination_ip: string | null;
  source_port: number | null;
  destination_port: number | null;
  process_name: string | null;
  process_path: string | null;
  parent_process: string | null;
  command_line: string | null;
  event_type: string;
  action: string;
  raw_reference: string;
  additional_fields: Record<string, any>;
}

export interface DetectionRecord {
  detection_id: string;
  rule_id: string;
  rule_name: string;
  severity: SeverityLevel;
  event_references: string[];
  matched_conditions: string;
  technique_id: string;
  technique_name: string;
  tactic: string;
  kill_chain_stage: string;
  confidence: number;
  timestamp: string;
  explanation: string;
  host: string | null;
  user: string | null;
  source_ip: string | null;
  destination_ip: string | null;
}

export interface IncidentRecord {
  incident_id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  risk_score: number;
  initial_compromise_time: string;
  latest_activity_time: string;
  root_cause_entity: string;
  affected_hosts: string[];
  affected_users: string[];
  target_assets: string[];
  detection_ids: string[];
  event_count: number;
  raw_alerts_merged: number;
  tactics_involved: string[];
  kill_chain_stages: string[];
  status: string;
}

export interface CytoscapeNodeData {
  id: string;
  label: string;
  entity_type: string;
  severity: string;
  is_compromised: boolean;
  is_target: boolean;
  is_hypothetical: boolean;
  details: Record<string, any>;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  relationship_type: string;
  confidence: number;
  is_inferred: boolean;
  is_potential_path: boolean;
  evidence_event_ids: string[];
  timestamp?: string;
}

export interface AttackGraphPayload {
  incident_id: string;
  nodes: { data: CytoscapeNodeData }[];
  edges: { data: CytoscapeEdgeData }[];
  summary: Record<string, any>;
}

export interface ReachabilityTarget {
  target_asset: string;
  asset_name: string;
  asset_criticality: string;
  hops_away: number;
  path: string[];
  reachability_type: string;
  missing_evidence: string;
  assumptions: string;
  exposure_score: number;
}

export interface ForwardReachabilityResult {
  incident_id: string;
  compromised_hosts: string[];
  compromised_users: string[];
  potential_next_targets: ReachabilityTarget[];
  blast_radius_summary: string;
  recommended_mitigations: string[];
}

export interface RuleValidationResult {
  rule_id: string;
  rule_name: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
  false_negative_rate: number;
  observations: string[];
}

export interface TelemetryCoverageResponse {
  overall_coverage_percent: number;
  techniques_covered: number;
  techniques_partial: number;
  techniques_missing: number;
  total_assessed: number;
  active_source_types: string[];
  matrix: {
    technique_id: string;
    technique_name: string;
    tactic: string;
    kill_chain_stage: string;
    required_telemetry: string;
    available_rules: string[];
    coverage_status: string;
    visibility_limitation: string;
  }[];
}
