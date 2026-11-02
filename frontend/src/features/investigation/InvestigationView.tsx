import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  GitBranch, Clock, FileSearch, ShieldAlert, Play, Pause,
  SkipForward, SkipBack, ZoomIn, ZoomOut, Maximize2, AlertTriangle,
  CheckCircle, ExternalLink, X, Search, Layers, RefreshCw, Shield
} from 'lucide-react';
import { IncidentRecord, AttackGraphPayload, CytoscapeNodeData, CytoscapeEdgeData } from '../../types';
import { api } from '../../services/api';

interface InvestigationViewProps {
  initialIncidentId?: string;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({ initialIncidentId }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '');
  const [graphData, setGraphData] = useState<AttackGraphPayload | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [evidenceEvents, setEvidenceEvents] = useState<any[]>([]);
  const [layoutName, setLayoutName] = useState<'breadthfirst' | 'cose' | 'concentric'>('breadthfirst');
  const [nodeFilter, setNodeFilter] = useState('');

  // Investigation Replay State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [replaySpeed, setReplaySpeed] = useState(1500); // ms per step

  const cyContainerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Load Incidents List
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await api.getIncidents();
        setIncidents(data);
        if (data.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(data[0].incident_id);
        }
      } catch (e) {
        console.error('Failed to load incidents', e);
      }
    };
    fetchIncidents();
  }, [initialIncidentId]);

  // Load Incident Graph & Timeline
  useEffect(() => {
    if (!selectedIncidentId) return;

    const loadIncidentDetails = async () => {
      try {
        const [gData, tlData] = await Promise.all([
          api.getIncidentGraph(selectedIncidentId, true),
          api.getIncidentTimeline(selectedIncidentId),
        ]);
        setGraphData(gData);
        setTimeline(tlData);
        setCurrentStepIndex(tlData.length - 1); // Full view by default
      } catch (e) {
        console.error('Failed to load incident graph', e);
      }
    };
    loadIncidentDetails();
  }, [selectedIncidentId]);

  // Initialize and Render Cytoscape.js Graph in Light Enterprise Theme
  useEffect(() => {
    if (!cyContainerRef.current || !graphData || graphData.nodes.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements = [
      ...graphData.nodes.map((n) => ({
        group: 'nodes' as const,
        data: n.data,
      })),
      ...graphData.edges.map((e) => ({
        group: 'edges' as const,
        data: e.data,
      })),
    ];

    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: elements,
      style: [
        // Base Node Style (Crisp Light Theme)
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#1E293B',
            'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#FFFFFF',
            'border-width': 2,
            'border-color': '#4F46E5',
            'width': 38,
            'height': 38,
          },
        },
        // Host Node
        {
          selector: 'node[entity_type = "host"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#FFFFFF',
            'border-color': '#4F46E5',
            'border-width': 2.5,
          },
        },
        // User Account Node
        {
          selector: 'node[entity_type = "user"]',
          style: {
            'shape': 'ellipse',
            'background-color': '#FFFFFF',
            'border-color': '#2563EB',
            'border-width': 2.5,
          },
        },
        // External Threat IP Node
        {
          selector: 'node[entity_type = "ip"]',
          style: {
            'shape': 'diamond',
            'background-color': '#FEF2F2',
            'border-color': '#DC2626',
            'border-width': 2.5,
            'width': 42,
            'height': 42,
          },
        },
        // Target Critical Asset Node
        {
          selector: 'node[is_target = true]',
          style: {
            'border-color': '#D97706',
            'border-width': 3,
            'background-color': '#FFFBEB',
          },
        },
        // Hypothetical / Exposure Target (Strictly Dashed Border)
        {
          selector: 'node[is_hypothetical = true]',
          style: {
            'shape': 'hexagon',
            'background-color': '#FFFDF7',
            'border-style': 'dashed',
            'border-color': '#D97706',
            'border-width': 2,
          },
        },
        // Directed Edges Base
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94A3B8',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'font-weight': 500,
            'color': '#475569',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-color': '#FFFFFF',
            'text-background-opacity': 0.85,
            'text-background-padding': '2px',
          },
        },
        // Verified Compromise Edges
        {
          selector: 'edge[is_potential_path = false]',
          style: {
            'line-color': '#4F46E5',
            'target-arrow-color': '#4F46E5',
            'width': 2.5,
          },
        },
        // Potential Forward Reachability Path (Strictly Dashed Amber)
        {
          selector: 'edge[is_potential_path = true]',
          style: {
            'line-style': 'dashed',
            'line-color': '#D97706',
            'target-arrow-color': '#D97706',
            'line-dash-pattern': [6, 4],
            'width': 1.8,
          },
        },
        // Selection State
        {
          selector: ':selected',
          style: {
            'border-color': '#0F172A',
            'border-width': 3,
            'line-color': '#0F172A',
            'target-arrow-color': '#0F172A',
          },
        },
      ],
      layout: {
        name: layoutName,
        directed: true,
        padding: 40,
        spacingFactor: 1.5,
      },
    });

    // Node Click -> Inspect Entity Details
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedEntity({ type: 'node', data: node.data() });
    });

    // Edge Click -> Inspect Relationship & Evidence
    cy.on('tap', 'edge', async (evt) => {
      const edge = evt.target;
      const data = edge.data();
      setSelectedEntity({ type: 'edge', data });

      const evIds = data.evidence_event_ids || [];
      if (evIds.length > 0) {
        try {
          const evidenceRes = await api.getIncidentEvidence(selectedIncidentId);
          const matched = evidenceRes.events.filter((e: any) => evIds.includes(e.event_id));
          setEvidenceEvents(matched);
          setEvidenceDrawerOpen(true);
        } catch (e) {}
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEntity(null);
      }
    });

    cyRef.current = cy;
  }, [graphData, layoutName]);

  // Node Search Filter
  useEffect(() => {
    if (!cyRef.current) return;
    if (!nodeFilter) {
      cyRef.current.nodes().style('opacity', 1);
      cyRef.current.edges().style('opacity', 1);
      return;
    }
    const q = nodeFilter.toLowerCase();
    cyRef.current.nodes().forEach((n) => {
      const label = n.data('label')?.toLowerCase() || '';
      const matches = label.includes(q);
      n.style('opacity', matches ? 1 : 0.2);
    });
  }, [nodeFilter]);

  // Replay Execution Timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && timeline.length > 0) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeline, replaySpeed]);

  const handleTimelineStepClick = async (step: any, index: number) => {
    setCurrentStepIndex(index);
    if (step.event_references && step.event_references.length > 0) {
      try {
        const evidenceRes = await api.getIncidentEvidence(selectedIncidentId);
        const matched = evidenceRes.events.filter((e: any) => step.event_references.includes(e.event_id));
        setEvidenceEvents(matched);
        setEvidenceDrawerOpen(true);
      } catch (e) {}
    }
  };

  const currentIncident = incidents.find((i) => i.incident_id === selectedIncidentId);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'var(--app-bg)',
    }}>
      {/* Top Investigation Toolbar */}
      <div style={{
        height: '52px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: 'var(--space-3)',
      }}>
        {/* Left: Incident Selector & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            style={{
              padding: '6px var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontWeight: 600,
              fontSize: 'var(--font-size-btn)',
              color: 'var(--text-primary)',
            }}
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} — {inc.title.substring(0, 40)} (Risk: {inc.risk_score})
              </option>
            ))}
          </select>

          {currentIncident && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-helper)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Risk: </span>
                <strong style={{ color: currentIncident.risk_score >= 80 ? 'var(--color-critical)' : 'var(--color-medium)' }}>
                  {currentIncident.risk_score}/100
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Entry: </span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{currentIncident.root_cause_entity}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Center: Graph Filter & Layout Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px var(--space-3)',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Find entity in graph..."
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--font-size-btn)',
                width: '140px',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <select
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value as any)}
            style={{
              padding: '6px var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontSize: 'var(--font-size-btn)',
              color: 'var(--text-secondary)',
            }}
          >
            <option value="breadthfirst">Hierarchical Flow</option>
            <option value="cose">Force-Directed</option>
            <option value="concentric">Concentric Rings</option>
          </select>

          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
              title="Zoom in"
              style={{ padding: '6px 10px', background: 'var(--surface)', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
              title="Zoom out"
              style={{ padding: '6px 10px', background: 'var(--surface)', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => cyRef.current?.fit()}
              title="Fit to view"
              style={{ padding: '6px 10px', background: 'var(--surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Right: Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-helper)', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#FFFFFF', border: '2px solid #4F46E5', borderRadius: '2px' }} />
            <span>Host</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#FFFFFF', border: '2px solid #2563EB', borderRadius: '50%' }} />
            <span>User</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#FFFDF7', border: '2px dashed #D97706', borderRadius: '2px' }} />
            <span style={{ color: 'var(--color-medium)' }}>Potential Target</span>
          </div>
        </div>
      </div>

      {/* Main Investigation Canvas & Right Timeline */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        {/* Cytoscape Canvas Container */}
        <div style={{
          position: 'relative',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Canvas Render Element */}
          <div ref={cyContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Replay Controller Footer */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '16px',
            right: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Timeline Playback:
              </span>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Step backward"
              >
                <SkipBack size={15} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: isPlaying ? 'var(--color-medium)' : 'var(--accent)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                {isPlaying ? 'Pause' : 'Play Sequence'}
              </button>

              <button
                onClick={() => setCurrentStepIndex((p) => Math.min(timeline.length - 1, p + 1))}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Step forward"
              >
                <SkipForward size={15} />
              </button>

              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Step {currentStepIndex + 1} of {timeline.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Speed:</span>
              <select
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                style={{
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: '11px',
                }}
              >
                <option value={2000}>0.5x</option>
                <option value={1200}>1x</option>
                <option value={600}>2x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Chronological Incident Timeline */}
        <div style={{
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Timeline Header */}
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={16} color="var(--accent)" />
              <h3 className="panel-title">
                Attack Sequence Timeline
              </h3>
            </div>
            <span className="helper-text">
              {timeline.length} Steps
            </span>
          </div>

          {/* Timeline Step Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
            {timeline.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No events recorded in incident timeline.
              </div>
            ) : (
              timeline.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                return (
                  <div
                    key={step.id || idx}
                    onClick={() => handleTimelineStepClick(step, idx)}
                    style={{
                      padding: 'var(--space-3)',
                      marginBottom: 'var(--space-2)',
                      backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--surface-subtle)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'border-color 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                      <span style={{
                        fontSize: 'var(--font-size-badge)',
                        fontWeight: 'var(--font-weight-badge)',
                        backgroundColor: 'var(--color-info-bg)',
                        color: 'var(--color-info)',
                        border: '1px solid var(--color-info-border)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-xs)',
                      }}>
                        {step.kill_chain_stage || 'Exploitation'}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-metadata)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {step.timestamp.split('T')[1]?.substring(0, 8)}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-table-content)', color: 'var(--text-primary)' }}>
                      {step.title}
                    </div>

                    <div className="helper-text" style={{ marginTop: '2px' }}>
                      {step.description}
                    </div>

                    {step.event_references && step.event_references.length > 0 && (
                      <div style={{
                        marginTop: 'var(--space-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: 'var(--font-size-metadata)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}>
                        <FileSearch size={14} />
                        <span>Inspect {step.event_references.length} Forensic Evidence Event(s)</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Forensic Evidence Inspector Drawer */}
      {evidenceDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '580px',
          height: '100vh',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Drawer Header */}
          <div style={{
            height: '56px',
            padding: '0 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSearch size={18} color="var(--accent)" />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Forensic Evidence Provenance Inspector
              </h2>
            </div>
            <button
              onClick={() => setEvidenceDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body: Raw Preserved Events */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Verifiable raw telemetry artifacts proving this detection and relationship link:
            </div>

            {evidenceEvents.map((ev, i) => (
              <div
                key={ev.event_id || i}
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                    Event ID: {ev.event_id}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {ev.timestamp}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Host: </span>
                    <strong>{ev.host || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>User: </span>
                    <strong>{ev.user || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Source: </span>
                    <span>{ev.source}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Action: </span>
                    <span>{ev.action}</span>
                  </div>
                </div>

                {ev.command_line && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      Command Execution:
                    </span>
                    <div style={{
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                    }}>
                      {ev.command_line}
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Raw Forensic Artifact Reference:
                  </span>
                  <div style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                  }}>
                    {ev.raw_reference}
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span style={{ color: 'var(--color-low)', fontWeight: 600 }}>✔ Audit-Ready Provenance Verified</span>
                  <span style={{ color: 'var(--text-muted)' }}>Ingestion: {ev.ingestion_timestamp?.substring(0, 19)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
