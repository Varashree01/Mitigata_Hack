import React from 'react';
import {
  Play, Pause, Square, ShieldAlert, Radio, Server,
  Bell, ChevronRight, User
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  simStatus: string;
  onStartSim: () => void;
  onPauseSim: () => void;
  onStopSim: () => void;
  activeIncidentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  simStatus,
  onStartSim,
  onPauseSim,
  onStopSim,
  activeIncidentsCount,
}) => {
  const tabTitles: Record<string, { group: string; title: string }> = {
    dashboard: { group: 'Overview', title: 'Command Center' },
    livestream: { group: 'Investigation', title: 'Live Event Stream' },
    investigation: { group: 'Investigation', title: 'Attack Graph & Provenance' },
    incidents: { group: 'Investigation', title: 'Incident Queue' },
    exposure: { group: 'Exposure Intelligence', title: 'Forward Reachability & Blast Radius' },
    ingestion: { group: 'Data Management', title: 'Data Ingestion Pipeline' },
    telemetry: { group: 'Data Management', title: 'Telemetry Coverage Matrix' },
    validation: { group: 'Detection', title: 'Rule Validation Lab' },
    reports: { group: 'Analysis', title: 'Incident Forensic Reports' },
    evaluation: { group: 'Analysis', title: 'Benchmarks & Evaluation' },
    settings: { group: 'System', title: 'Platform Settings' },
  };

  const meta = tabTitles[currentTab] || { group: 'Workspace', title: currentTab };

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--header-bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Breadcrumb Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-header)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{meta.group}</span>
        <ChevronRight size={14} color="var(--text-subtle)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meta.title}</span>
      </div>

      {/* Right Operational Controls & Vitals */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Environment / Telemetry Source Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '4px var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--border)',
          fontSize: 'var(--font-size-helper)',
          fontWeight: 'var(--font-weight-btn)',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          <Server size={14} color="var(--accent)" />
          <span>Source: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Streaming Engine</strong></span>
        </div>

        {/* Live Simulation Controls & Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px var(--space-2)',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: simStatus === 'running' ? 'var(--color-low)' : (simStatus === 'paused' ? 'var(--color-medium)' : 'var(--text-subtle)'),
            }} />
            <span style={{
              fontSize: 'var(--font-size-metadata)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: simStatus === 'running' ? 'var(--color-low)' : (simStatus === 'paused' ? 'var(--color-medium)' : 'var(--text-muted)'),
            }}>
              {simStatus}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: 'var(--space-2)' }}>
            {simStatus === 'running' ? (
              <button
                onClick={onPauseSim}
                title="Pause simulation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-medium)',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Pause size={14} />
              </button>
            ) : (
              <button
                onClick={onStartSim}
                title="Start simulation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Play size={14} />
              </button>
            )}

            <button
              onClick={onStopSim}
              disabled={simStatus === 'stopped'}
              title="Stop simulation"
              style={{
                background: 'none',
                border: 'none',
                color: simStatus !== 'stopped' ? 'var(--color-critical)' : 'var(--text-subtle)',
                cursor: simStatus !== 'stopped' ? 'pointer' : 'not-allowed',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Square size={14} />
            </button>
          </div>
        </div>

        {/* Active Incident Counter Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: activeIncidentsCount > 0 ? 'var(--color-critical-bg)' : 'var(--surface-subtle)',
          border: `1px solid ${activeIncidentsCount > 0 ? 'var(--color-critical-border)' : 'var(--border)'}`,
          fontSize: 'var(--font-size-helper)',
          fontWeight: 600,
          color: activeIncidentsCount > 0 ? 'var(--color-critical)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}>
          <ShieldAlert size={14} />
          <span>{activeIncidentsCount} Incident{activeIncidentsCount !== 1 ? 's' : ''}</span>
        </div>

        {/* User Identity Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          paddingLeft: 'var(--space-3)',
          borderLeft: '1px solid var(--border)',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            <User size={15} />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, color: 'var(--text-primary)' }}>SecOps Analyst</div>
            <div style={{ fontSize: 'var(--font-size-metadata)', color: 'var(--text-muted)' }}>Tracx SOC</div>
          </div>
        </div>
      </div>
    </header>
  );
};
