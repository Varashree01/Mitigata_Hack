import React, { useEffect, useState } from 'react';
import {
  Activity, ShieldAlert, Cpu, HardDrive, Users, Server,
  Clock, ArrowUpRight, AlertTriangle, CheckCircle, RefreshCw,
  Zap, Filter, Layers, Database
} from 'lucide-react';
import { SystemTelemetry, IncidentRecord, DetectionRecord } from '../../types';
import { api } from '../../services/api';

interface CommandCenterProps {
  onInvestigate: (incidentId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onInvestigate }) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [tData, iData, dData] = await Promise.all([
        api.getTelemetry(),
        api.getIncidents(),
        api.getDetections(undefined, 6)
      ]);
      setTelemetry(tData);
      setIncidents(iData);
      setDetections(dData);
    } catch (e) {
      console.error("Telemetry fetch failed", e);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 400);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  const getSeverityBadge = (sev: string) => {
    const s = sev.toLowerCase();
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      critical: { bg: 'var(--color-critical-bg)', color: 'var(--color-critical)', border: 'var(--color-critical-border)' },
      high: { bg: 'var(--color-high-bg)', color: 'var(--color-high)', border: 'var(--color-high-border)' },
      medium: { bg: 'var(--color-medium-bg)', color: 'var(--color-medium)', border: 'var(--color-medium-border)' },
      low: { bg: 'var(--color-low-bg)', color: 'var(--color-low)', border: 'var(--color-low-border)' },
      info: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)' },
    };
    const style = styles[s] || styles.info;
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 'var(--font-size-badge)',
        fontWeight: 'var(--font-weight-badge)',
        textTransform: 'capitalize',
        padding: '2px 8px',
        borderRadius: 'var(--radius-xs)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {sev}
      </span>
    );
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: 'var(--space-6) var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    }}>
      {/* Title & Actions Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 className="page-title">
            Command Center
          </h1>
          <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Real-time pipeline telemetry, threat detections, and multi-host incident correlation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '5px var(--space-3)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-helper)',
            color: 'var(--text-secondary)',
          }}>
            <Clock size={14} color="var(--text-muted)" />
            <span>Time Window: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Last 2 Hours (Live)</strong></span>
          </div>

          <button
            onClick={handleManualRefresh}
            title="Refresh statistics"
            className="btn-secondary"
            style={{ height: '30px', padding: '0 12px' }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Standardized KPI Metric Strip (Compact 6-Card Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {/* Events Ingested */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Events Ingested
            </span>
            <Database size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? telemetry.events_processed.toLocaleString() : '0'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--color-low)', marginTop: 'var(--space-1)', fontWeight: 500 }}>
            {telemetry?.events_per_second || 0} EPS throughput
          </div>
        </div>

        {/* Threat Detections */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Threat Detections
            </span>
            <AlertTriangle size={16} color="var(--color-high)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-high)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? telemetry.suspicious_detections : '0'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Latency: {telemetry ? telemetry.detection_latency_ms : 0}ms
          </div>
        </div>

        {/* Active Incidents */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Active Incidents
            </span>
            <ShieldAlert size={16} color="var(--color-critical)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-critical)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? telemetry.active_incidents : '0'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--color-critical)', marginTop: 'var(--space-1)', fontWeight: 500 }}>
            {telemetry ? telemetry.critical_incidents : 0} Critical Severity
          </div>
        </div>

        {/* Impacted Hosts */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Impacted Hosts
            </span>
            <Server size={16} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? telemetry.hosts_involved : '0'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Endpoint entities
          </div>
        </div>

        {/* Users & Credentials */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Users & Credentials
            </span>
            <Users size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? telemetry.users_involved : '0'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Active accounts
          </div>
        </div>

        {/* Engine Resource Vitals */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
              Engine Vitals
            </span>
            <Cpu size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {telemetry ? `${telemetry.cpu_percent}%` : '0%'}
          </div>
          <div style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            RAM: {telemetry ? `${telemetry.memory_percent}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Main Prioritized Incidents Table */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Table Header Bar */}
        <div style={{
          padding: '12px var(--space-4)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
            <ShieldAlert size={16} color="var(--accent)" />
            <h2 className="panel-title" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
              Prioritized Reconstructed Incidents
            </h2>
            <span style={{
              fontSize: 'var(--font-size-badge)',
              fontWeight: 'var(--font-weight-badge)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
            }}>
              {incidents.length} Active
            </span>
          </div>

          <div className="helper-text" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
            Ranked by Explainable Multi-Factor Risk Score (0 - 100)
          </div>
        </div>

        {incidents.length === 0 ? (
          <div style={{
            padding: 'var(--space-8) var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <ShieldAlert size={36} color="var(--text-subtle)" strokeWidth={1.5} />
            <div style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No Active Security Incidents
            </div>
            <div className="helper-text" style={{ maxWidth: '420px' }}>
              The pipeline is operational and monitoring telemetry. Start the live stream or upload log batches to reconstruct attack paths.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1040px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderBottom: '1px solid var(--border)',
                  height: '38px',
                }}>
                  <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Incident ID</th>
                  <th className="table-header-cell" style={{ width: '110px', whiteSpace: 'nowrap' }}>Risk Score</th>
                  <th className="table-header-cell" style={{ width: '100px', whiteSpace: 'nowrap' }}>Severity</th>
                  <th className="table-header-cell">Attack Narrative & Scope</th>
                  <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Root Entry</th>
                  <th className="table-header-cell" style={{ width: '150px' }}>Impacted Hosts</th>
                  <th className="table-header-cell" style={{ width: '180px' }}>Kill Chain Stages</th>
                  <th className="table-header-cell" style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      height: 'var(--table-row-height)',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="table-body-cell" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      {inc.incident_id}
                    </td>

                    <td className="table-body-cell" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 'var(--font-size-body)',
                          color: inc.risk_score >= 80 ? 'var(--color-critical)' : (inc.risk_score >= 50 ? 'var(--color-high)' : 'var(--accent)')
                        }}>
                          {inc.risk_score}
                        </span>
                        <span className="metadata-text">/ 100</span>
                      </div>
                    </td>

                    <td className="table-body-cell">
                      {getSeverityBadge(inc.severity)}
                    </td>

                    <td className="table-body-cell" style={{ maxWidth: '380px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.title}
                      </div>
                      <div className="helper-text" style={{ marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.raw_alerts_merged} alerts merged from {inc.event_count} raw security events
                      </div>
                    </td>

                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-helper)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {inc.root_cause_entity}
                    </td>

                    <td className="table-body-cell">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {inc.affected_hosts.map((h) => (
                          <span key={h} style={{
                            backgroundColor: 'var(--surface-subtle)',
                            border: '1px solid var(--border)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 'var(--font-size-metadata)',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="table-body-cell">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {inc.kill_chain_stages.map((kc) => (
                          <span key={kc} style={{
                            backgroundColor: 'var(--color-info-bg)',
                            color: 'var(--color-info)',
                            border: '1px solid var(--color-info-border)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 'var(--font-size-metadata)',
                            fontWeight: 'var(--font-weight-badge)',
                            whiteSpace: 'nowrap',
                          }}>
                            {kc}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="table-body-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onInvestigate(inc.incident_id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          backgroundColor: 'var(--accent)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-btn)',
                          fontWeight: 'var(--font-weight-btn)',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                      >
                        Investigate <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Detections Stream Strip */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Zap size={16} color="var(--color-high)" />
            <h3 className="panel-title">
              Recent Triggered Sigma Detections
            </h3>
          </div>
          <span className="helper-text">
            Empirically mapped to ATT&CK tactics
          </span>
        </div>

        {detections.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent threat detections recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {detections.map((d) => (
              <div
                key={d.detection_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: '1px solid var(--border-light)',
                  gap: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {getSeverityBadge(d.severity)}
                  <div>
                    <span style={{ fontSize: 'var(--font-size-table-content)', fontWeight: 600, color: 'var(--text-primary)' }}>{d.rule_name}</span>
                    <span className="helper-text" style={{ marginLeft: 'var(--space-2)' }}>{d.explanation}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                  <span style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--font-size-metadata)',
                    color: 'var(--text-secondary)',
                  }}>
                    {d.technique_id} · {d.kill_chain_stage}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-metadata)' }}>
                    {d.timestamp.split('T')[1]?.substring(0, 8) || d.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
