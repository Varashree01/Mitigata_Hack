import React, { useEffect, useState } from 'react';
import { Radar, ShieldAlert, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';

export const TelemetryCoverageView: React.FC = () => {
  const [coverage, setCoverage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const data = await api.getTelemetryCoverage();
        setCoverage(data);
      } catch (e) {
        console.error('Failed to fetch coverage', e);
      }
    };
    fetchCoverage();
  }, []);

  const filteredMatrix = coverage?.matrix.filter((row: any) => {
    if (statusFilter !== 'all' && row.coverage_status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        row.technique_id.toLowerCase().includes(q) ||
        row.technique_name.toLowerCase().includes(q) ||
        row.tactic.toLowerCase().includes(q) ||
        row.required_telemetry.toLowerCase().includes(q)
      );
    }
    return true;
  }) || [];

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: 'var(--space-6) var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    }}>
      {/* Consistent Left-Aligned Header */}
      <div>
        <h1 className="page-title">
          Telemetry Coverage
        </h1>
        <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
          Sensor audit mapping log sources to MITRE ATT&CK techniques and identifying detection gaps.
        </p>
      </div>

      {coverage && (
        <>
          {/* Summary Stat Cards (4 Columns Compact Responsive Grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
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
                Evaluated Coverage
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--accent)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {coverage.overall_coverage_percent}%
              </div>
              <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
                Across assessed techniques
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
                Active Covered
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-low)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {coverage.techniques_covered} Techniques
              </div>
              <div className="helper-text" style={{ color: 'var(--color-low)', marginTop: 'var(--space-1)' }}>
                Telemetry & Rules Active
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
                Partial Visibility
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-medium)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {coverage.techniques_partial} Techniques
              </div>
              <div className="helper-text" style={{ color: 'var(--color-medium)', marginTop: 'var(--space-1)' }}>
                Rule loaded; awaiting telemetry
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
                Sensor Blind Spots
              </span>
              <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-critical)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
                {coverage.techniques_missing} Techniques
              </div>
              <div className="helper-text" style={{ color: 'var(--color-critical)', marginTop: 'var(--space-1)' }}>
                Unmonitored / EDR required
              </div>
            </div>
          </div>

          {/* Matrix Container */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            {/* Filter Bar */}
            <div style={{
              padding: 'var(--space-3) var(--space-5)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--surface-subtle)',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px var(--space-3)',
                  width: '260px',
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search technique or telemetry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontSize: 'var(--font-size-btn)',
                      color: 'var(--text-primary)',
                      width: '100%',
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px var(--space-3)',
                    fontSize: 'var(--font-size-btn)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available (Covered)</option>
                  <option value="partial">Partial</option>
                  <option value="missing">Missing / Gap</option>
                </select>
              </div>

              <span className="helper-text">
                Active Log Sources: <strong style={{ color: 'var(--text-primary)' }}>{coverage.active_source_types.join(', ') || 'Awaiting Streaming Logs'}</strong>
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    height: '38px',
                  }}>
                    <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Technique ID</th>
                    <th className="table-header-cell">Technique Name</th>
                    <th className="table-header-cell" style={{ width: '150px' }}>Tactic</th>
                    <th className="table-header-cell" style={{ width: '140px' }}>Kill Chain Stage</th>
                    <th className="table-header-cell">Required Telemetry</th>
                    <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Coverage Status</th>
                    <th className="table-header-cell">Visibility Limitations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrix.map((row: any) => (
                    <tr
                      key={row.technique_id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        height: 'var(--table-row-height)',
                      }}
                    >
                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                        {row.technique_id}
                      </td>

                      <td className="table-body-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.technique_name}
                      </td>

                      <td className="table-body-cell" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {row.tactic}
                      </td>

                      <td className="table-body-cell">
                        <span style={{
                          backgroundColor: 'var(--color-info-bg)',
                          color: 'var(--color-info)',
                          border: '1px solid var(--color-info-border)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: 'var(--font-size-metadata)',
                          fontWeight: 'var(--font-weight-badge)',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.kill_chain_stage}
                        </span>
                      </td>

                      <td className="table-body-cell" style={{ fontSize: 'var(--font-size-table-content)', color: 'var(--text-secondary)' }}>
                        {row.required_telemetry}
                      </td>

                      <td className="table-body-cell" style={{ whiteSpace: 'nowrap' }}>
                        <span style={{
                          backgroundColor: row.coverage_status === 'Available' ? 'var(--color-low-bg)' : (row.coverage_status === 'Partial' ? 'var(--color-medium-bg)' : 'var(--color-critical-bg)'),
                          color: row.coverage_status === 'Available' ? 'var(--color-low)' : (row.coverage_status === 'Partial' ? 'var(--color-medium)' : 'var(--color-critical)'),
                          border: `1px solid ${row.coverage_status === 'Available' ? 'var(--color-low-border)' : (row.coverage_status === 'Partial' ? 'var(--color-medium-border)' : 'var(--color-critical-border)')}`,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: 'var(--font-size-badge)',
                          fontWeight: 'var(--font-weight-badge)',
                          textTransform: 'capitalize',
                        }}>
                          {row.coverage_status}
                        </span>
                      </td>

                      <td className="table-body-cell" style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-muted)', maxWidth: '300px' }}>
                        {row.visibility_limitation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
