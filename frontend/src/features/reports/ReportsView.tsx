import React, { useEffect, useState } from 'react';
import { FileText, Download, Check, AlertTriangle, ShieldCheck, Clock, Shield, Copy } from 'lucide-react';
import { IncidentRecord } from '../../types';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [report, setReport] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

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
    const fetchReport = async () => {
      try {
        const res = await api.getIncidentReport(selectedIncidentId);
        setReport(res);
      } catch (e) {
        console.error('Failed to fetch report', e);
      }
    };
    fetchReport();
  }, [selectedIncidentId]);

  const handleCopyMarkdown = () => {
    if (!report) return;

    const md = `
# Forensic Incident Investigation Report: ${report.title}
**Report ID**: ${report.report_id}  
**Generated**: ${report.generated_at}  
**Risk Score**: ${report.risk_score} / 100  
**Root Cause Entity**: ${report.initial_observed_activity?.entity}  

## 1. Executive Summary
${report.executive_summary}

## 2. Initial Observed Compromise
- Timestamp: ${report.initial_observed_activity?.timestamp}
- Entity: ${report.initial_observed_activity?.entity}
- Details: ${report.initial_observed_activity?.description}

## 3. Scope of Affected Entities
- Compromised Hosts: ${report.affected_entities?.hosts?.join(', ')}
- Compromised Accounts: ${report.affected_entities?.users?.join(', ')}
- Target Assets: ${report.affected_entities?.target_assets?.join(', ')}

## 4. Kill Chain Stages & MITRE ATT&CK
- Kill Chain Stages: ${report.kill_chain_stages?.join(' -> ')}
- ATT&CK Tactics: ${report.mitre_techniques?.join(', ')}

## 5. Potential Forward Reachability
${report.potential_next_targets?.map((t: any) => `- **${t.name} (${t.target})** [${t.criticality}]: Path: ${t.path}. Assumptions: ${t.assumptions}`).join('\n')}

## 6. Recommended Immediate Containment
${report.recommended_investigation_actions?.map((a: string) => `- [ ] ${a}`).join('\n')}

## 7. Strategic Remediation
${report.suggested_remediation?.map((r: string) => `- [ ] ${r}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">
            Forensic Reports
          </h1>
          <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Incident investigation reports detailing entry points, lateral movement, forward exposure, and containment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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

          <button
            onClick={handleCopyMarkdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '8px var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-btn)',
              fontWeight: 'var(--font-weight-btn)',
              cursor: 'pointer',
              transition: 'background-color 0.12s ease',
            }}
          >
            {copied ? <Check size={14} color="var(--color-low)" /> : <Copy size={14} />}
            {copied ? 'Copied Markdown' : 'Copy Report MD'}
          </button>
        </div>
      </div>

      {report && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-xs)',
          maxWidth: '1200px',
        }}>
          {/* Document Header */}
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-metadata)', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Forensic Incident Investigation Report
                </span>
                <h2 className="section-title" style={{ marginTop: 'var(--space-1)' }}>
                  {report.title}
                </h2>
                <div className="metadata-text" style={{ marginTop: 'var(--space-1)' }}>
                  Report ID: {report.report_id} · Generated: {report.generated_at} · Format: {report.format}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="helper-text">Explainable Risk Score</span>
                <div style={{
                  fontSize: 'var(--font-size-metric-value)',
                  fontWeight: 'var(--font-weight-metric-value)',
                  color: report.risk_score >= 80 ? 'var(--color-critical)' : 'var(--color-medium)',
                  lineHeight: 1.1,
                  marginTop: 'var(--space-1)',
                }}>
                  {report.risk_score} / 100
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-2)' }}>
              1. Executive Summary
            </h3>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {report.executive_summary}
            </p>
          </div>

          {/* Section 2: Affected Entities Scope */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-3)' }}>
              2. Scope of Affected Entities
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>Compromised Hosts</span>
                <div style={{ fontWeight: 600, marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-table-content)' }}>
                  {report.affected_entities.hosts.join(', ') || 'None'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>Compromised Accounts</span>
                <div style={{ fontWeight: 600, marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-table-content)' }}>
                  {report.affected_entities.users.join(', ') || 'None'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>Kill Chain Progression</span>
                <div style={{ fontWeight: 600, marginTop: 'var(--space-1)', color: 'var(--color-info)', fontSize: 'var(--font-size-table-content)' }}>
                  {report.kill_chain_stages.join(' → ')}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attack Timeline */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-3)' }}>
              3. Chronological Attack Sequence
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {report.timeline.map((step: any) => (
                <div
                  key={step.step_number}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-table-content)',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      #{step.step_number}
                    </span>
                    <span style={{ fontWeight: 600 }}>{step.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-helper)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{step.technique} · {step.kill_chain_stage}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {step.timestamp.split('T')[1]?.substring(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Forward Exposure */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} color="var(--color-medium)" />
              4. Attack Exposure & Forward Reachability Analysis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {report.potential_next_targets.map((tgt: any) => (
                <div
                  key={tgt.target}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-table-content)',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{tgt.name} ({tgt.target})</strong>
                    <span className="helper-text" style={{ marginLeft: 'var(--space-2)' }}>
                      Path: {tgt.path} ({tgt.hops} hops)
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: tgt.criticality === 'Critical' ? 'var(--color-critical-bg)' : 'var(--color-high-bg)',
                    color: tgt.criticality === 'Critical' ? 'var(--color-critical)' : 'var(--color-high)',
                    border: `1px solid ${tgt.criticality === 'Critical' ? 'var(--color-critical-border)' : 'var(--color-high-border)'}`,
                    fontSize: 'var(--font-size-badge)',
                    fontWeight: 'var(--font-weight-badge)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    textTransform: 'capitalize',
                  }}>
                    {tgt.criticality}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Recommended Immediate Actions */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-2)' }}>
              5. Recommended Immediate Actions
            </h3>
            <ul style={{ paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }}>
              {report.recommended_investigation_actions.map((act: string, i: number) => (
                <li key={i} style={{ marginBottom: 'var(--space-1)' }}>{act}</li>
              ))}
            </ul>
          </div>

          {/* Section 6: Suggested Strategic Remediation */}
          <div>
            <h3 className="panel-title" style={{ marginBottom: 'var(--space-2)' }}>
              6. Suggested Long-Term Remediation
            </h3>
            <ul style={{ paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }}>
              {report.suggested_remediation.map((rem: string, i: number) => (
                <li key={i} style={{ marginBottom: 'var(--space-1)' }}>{rem}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
