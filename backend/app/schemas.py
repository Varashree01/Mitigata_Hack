from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class KillChainStage(str, Enum):
    RECONNAISSANCE = "Reconnaissance"
    WEAPONIZATION = "Weaponization"
    DELIVERY = "Delivery"
    EXPLOITATION = "Exploitation"
    INSTALLATION = "Installation"
    COMMAND_AND_CONTROL = "Command and Control"
    ACTIONS_ON_OBJECTIVES = "Actions on Objectives"

class NormalizedEvent(BaseModel):
    event_id: str
    timestamp: str  # ISO-8601 UTC
    ingestion_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source: str = "synthetic"  # "windows_sysmon", "linux_auth", "firewall", "synthetic"
    source_type: str = "endpoint"  # "endpoint", "network", "identity", "cloud"
    host: Optional[str] = None
    user: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    process_name: Optional[str] = None
    process_path: Optional[str] = None
    parent_process: Optional[str] = None
    command_line: Optional[str] = None
    event_type: str = "general"
    action: str = "observed"
    raw_reference: Optional[str] = None
    additional_fields: Dict[str, Any] = Field(default_factory=dict)

class DetectionRecord(BaseModel):
    detection_id: str
    rule_id: str
    rule_name: str
    severity: SeverityLevel
    event_references: List[str]
    matched_conditions: str
    technique_id: str
    technique_name: str
    tactic: str
    kill_chain_stage: KillChainStage
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: str
    explanation: str
    host: Optional[str] = None
    user: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None

class EntityRelationship(BaseModel):
    source_entity: str
    source_type: str  # "host", "user", "ip", "process", "asset"
    target_entity: str
    target_type: str
    relationship_type: str  # "AUTHENTICATED_TO", "EXECUTED_ON", "CONNECTED_TO", "SPAWNED_PROCESS", "ACCESSED", "ATTEMPTED_ACCESS", "EXFILTRATED_TO"
    evidence_event_ids: List[str]
    confidence: float = 1.0
    timestamp: str
    is_inferred: bool = False  # Clearly distinguish direct observation vs inference

class IncidentRecord(BaseModel):
    incident_id: str
    title: str
    description: str
    severity: SeverityLevel
    risk_score: float = Field(ge=0.0, le=100.0)
    initial_compromise_time: str
    latest_activity_time: str
    root_cause_entity: str
    affected_hosts: List[str]
    affected_users: List[str]
    target_assets: List[str]
    detection_ids: List[str]
    event_count: int
    raw_alerts_merged: int
    tactics_involved: List[str]
    kill_chain_stages: List[str]
    status: str = "active"  # "active", "contained", "investigating", "resolved"

class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    entity_type: str  # "host", "user", "ip", "process", "asset"
    severity: str = "low"
    is_compromised: bool = False
    is_target: bool = False
    is_hypothetical: bool = False
    details: Dict[str, Any] = Field(default_factory=dict)

class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData

class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship_type: str
    confidence: float = 1.0
    is_inferred: bool = False
    is_potential_path: bool = False  # Distinguish confirmed compromise vs future reachability
    evidence_event_ids: List[str] = Field(default_factory=list)
    timestamp: Optional[str] = None

class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData

class AttackGraphPayload(BaseModel):
    incident_id: str
    nodes: List[CytoscapeNode]
    edges: List[CytoscapeEdge]
    summary: Dict[str, Any]

class ReachabilityTarget(BaseModel):
    target_asset: str
    asset_name: str
    asset_criticality: str  # "Critical", "High", "Medium", "Low"
    hops_away: int
    path: List[str]
    reachability_type: str  # "network_exposure", "credential_reuse", "admin_privilege"
    missing_evidence: str
    assumptions: str
    exposure_score: float

class ForwardReachabilityResult(BaseModel):
    incident_id: str
    compromised_hosts: List[str]
    compromised_users: List[str]
    potential_next_targets: List[ReachabilityTarget]
    blast_radius_summary: str
    recommended_mitigations: List[str]

class IngestionRun(BaseModel):
    run_id: str
    filename: str
    source_type: str
    total_events: int = 0
    processed_events: int = 0
    dropped_events: int = 0
    duration_seconds: float = 0.0
    status: str = "completed"
    created_at: str

class RuleValidationResult(BaseModel):
    rule_id: str
    rule_name: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    precision: float
    recall: float
    false_positive_rate: float
    false_negative_rate: float
    observations: List[str]

class SystemTelemetry(BaseModel):
    events_received: int
    events_processed: int
    events_per_second: float
    suspicious_detections: int
    active_incidents: int
    critical_incidents: int
    hosts_involved: int
    users_involved: int
    current_status: str
    queue_backlog: int
    dropped_events: int
    cpu_percent: float
    memory_percent: float
    detection_latency_ms: float
    correlation_latency_ms: float
