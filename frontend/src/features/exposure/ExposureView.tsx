import React, { useEffect, useState } from 'react';
import { Crosshair, AlertTriangle, ShieldCheck, ArrowRight, Server, Shield } from 'lucide-react';
import { ForwardReachabilityResult, IncidentRecord } from '../../types';
import { api } from '../../services/api';

export const ExposureView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [exposure, setExposure] = useState<ForwardReachabilityResult | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await api.getIncidents();
        setIncidents(data);
        if (data.length > 0) {
          setSelectedIncidentId(data[0].incident_id);
        }
      } catch (e) {
        console.error('Failed to fetch incidents', e);
      }
    };
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    const fetchExposure = async () => {
      try {
        const res = await api.getForwardReachability(selectedIncidentId);
        setExposure(res);
      } catch (e) {
        console.error('Failed to fetch reachability', e);
      }
    };
    fetchExposure();
  }, [selectedIncidentId]);

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: 'var(--space-6) var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">
            Forward Reachability
          </h1>
          <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Graph traversal mapping reachable critical assets from confirmed footholds without confusing exposure with breach.
          </p>
        </div>

        <div>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            style={{
              padding: '8px var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontWeight: 600,
              fontSize: 'var(--font-size-btn)',
              color: 'var(--text-primary)',
            }}
          >
            {incidents.map((i) => (
              <option key={i.incident_id} value={i.incident_id}>
                {i.incident_id} — {i.title.substring(0, 45)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Distinction Advisory Callout */}
      <div style={{
        backgroundColor: 'var(--color-medium-bg)',
        border: '1px solid var(--color-medium-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <AlertTriangle size={18} color="var(--color-medium)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 'var(--font-size-table-content)', color: '#92400E', lineHeight: '1.4' }}>
          <strong>Analyst Rigor:</strong> Reachability calculates open network routes and administrative privilege paths. A system is <strong>reachable</strong>, NOT breached. No target system is treated as compromised without forensic log evidence.
        </div>
      </div>

      {exposure && (
        <>
          {/* Blast Radius Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '84px',
            }}>
              <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
                Confirmed Footholds
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-critical)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {exposure.compromised_hosts.length} Host(s)
              </div>
              <div className="helper-text" style={{ fontFamily: 'var(--font-mono)', marginTop: 'var(--space-1)' }}>
                {exposure.compromised_hosts.join(', ') || 'None'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '84px',
            }}>
              <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
                Potential Targets
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-medium)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {exposure.potential_next_targets.length} Enterprise Assets
              </div>
              <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
                Within reachable lateral blast radius
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '84px',
            }}>
              <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
                Tier-0 Critical Systems
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-critical)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {exposure.potential_next_targets.filter((t) => t.asset_criticality === 'Critical').length}
              </div>
              <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
                Domain Controllers & Vaults
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '84px',
            }}>
              <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
                Shortest Distance
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--accent)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {exposure.potential_next_targets.length > 0 ? `${exposure.potential_next_targets[0].hops_away} Hop` : '0 Hops'}
              </div>
              <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
                Direct network connectivity
              </div>
            </div>
          </div>

          {/* Potential Targets Exposure Table */}
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
                <Crosshair size={18} color="var(--accent)" />
                <h2 className="panel-title">
                  Potential Forward Reachability Paths & Attack Exposure
                </h2>
              </div>
              <span className="helper-text">
                Sorted by Asset Criticality & Exposure Score
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--surface-subtle)',
                    borderBottom: '1px solid var(--border)',
                    height: '38px',
                  }}>
                    <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Target Asset</th>
                    <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>Criticality</th>
                    <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Lateral Distance</th>
                    <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>Exposure Score</th>
                    <th className="table-header-cell">Traversed Network Path</th>
                    <th className="table-header-cell">Assumptions & Prerequisites</th>
                    <th className="table-header-cell">Missing Forensic Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {exposure.potential_next_targets.map((tgt) => (
                    <tr
                      key={tgt.target_asset}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        height: 'var(--table-row-height)',
                      }}
                    >
                      <td className="table-body-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{tgt.asset_name}</div>
                        <div style={{ fontSize: 'var(--font-size-metadata)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {tgt.target_asset}
                        </div>
                      </td>

                      <td className="table-body-cell">
                        <span style={{
                          backgroundColor: tgt.asset_criticality === 'Critical' ? 'var(--color-critical-bg)' : 'var(--color-high-bg)',
                          color: tgt.asset_criticality === 'Critical' ? 'var(--color-critical)' : 'var(--color-high)',
                          border: `1px solid ${tgt.asset_criticality === 'Critical' ? 'var(--color-critical-border)' : 'var(--color-high-border)'}`,
                          fontSize: 'var(--font-size-badge)',
                          fontWeight: 'var(--font-weight-badge)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                        }}>
                          {tgt.asset_criticality}
                        </span>
                      </td>

                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {tgt.hops_away} hop(s)
                      </td>

                      <td className="table-body-cell" style={{ fontWeight: 700, color: 'var(--color-medium)', whiteSpace: 'nowrap' }}>
                        {tgt.exposure_score}
                      </td>

                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-helper)', color: 'var(--accent)' }}>
                        {tgt.path.join(' → ')}
                      </td>

                      <td className="table-body-cell" style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        {tgt.assumptions}
                      </td>

                      <td className="table-body-cell" style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {tgt.missing_evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Containment Guidance */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldCheck size={18} color="var(--accent)" />
              Actionable Proactive Isolation & Containment Procedures
            </h3>
            <ul style={{ paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }}>
              {exposure.recommended_mitigations.map((m, i) => (
                <li key={i} style={{ marginBottom: 'var(--space-1)' }}>{m}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
