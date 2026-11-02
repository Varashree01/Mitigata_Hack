import React from 'react';
import {
  ShieldAlert, Activity, Database, Radio, GitBranch,
  Crosshair, CheckSquare, Radar, FileText, Cpu, Play, Square, Pause
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  simStatus: string;
  onStartSim: () => void;
  onPauseSim: () => void;
  onStopSim: () => void;
  activeIncidentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  simStatus,
  onStartSim,
  onPauseSim,
  onStopSim,
  activeIncidentsCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'livestream', label: 'Live Stream', icon: Radio },
    { id: 'investigation', label: 'Attack Graph', icon: GitBranch },
    { id: 'exposure', label: 'Forward Reachability', icon: Crosshair },
    { id: 'ingestion', label: 'Data Ingestion', icon: Database },
    { id: 'validation', label: 'Validation Lab', icon: CheckSquare },
    { id: 'telemetry', label: 'Coverage Audit', icon: Radar },
    { id: 'reports', label: 'Incident Reports', icon: FileText },
    { id: 'evaluation', label: 'Benchmarks & Evaluation', icon: Cpu },
  ];

  return (
    <header style={{
      backgroundColor: 'var(--elastic-bg-header)',
      borderBottom: '1px solid var(--elastic-border-base)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* Brand & Global Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: '1px solid var(--elastic-border-subtle)',
      }}>
        {/* Brand identity following Elastic visual language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--elastic-teal)',
            borderRadius: 'var(--radius-sm)',
            color: '#0c1017',
            fontWeight: 800,
            fontSize: '18px',
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '0.04em',
                color: 'var(--elastic-text-primary)'
              }}>
                Tracx
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--elastic-teal)',
                backgroundColor: 'var(--elastic-teal-subtle)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                letterSpacing: '0.05em'
              }}>
                KILL CHAIN INTELLIGENCE
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--elastic-text-muted)' }}>
              Autonomous Attack Path Reconstruction & Forward Reachability Platform
            </div>
          </div>
        </div>

        {/* Global Live Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Active Incidents Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: activeIncidentsCount > 0 ? 'var(--sev-critical-bg)' : 'var(--elastic-bg-surface-elevated)',
            border: `1px solid ${activeIncidentsCount > 0 ? 'var(--sev-critical-border)' : 'var(--elastic-border-base)'}`,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            color: activeIncidentsCount > 0 ? 'var(--sev-critical)' : 'var(--elastic-text-secondary)',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeIncidentsCount > 0 ? 'var(--sev-critical)' : 'var(--elastic-text-muted)',
            }} />
            {activeIncidentsCount} Active Incident{activeIncidentsCount !== 1 ? 's' : ''}
          </div>

          {/* Simulation Status & Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--elastic-bg-card)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--elastic-border-base)'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--elastic-text-secondary)' }}>Live Feed:</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: simStatus === 'running' ? 'var(--elastic-green)' : (simStatus === 'paused' ? 'var(--elastic-yellow)' : 'var(--elastic-text-muted)')
            }}>
              {simStatus}
            </span>

            {simStatus === 'running' ? (
              <button
                onClick={onPauseSim}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--elastic-yellow)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Pause Simulation"
              >
                <Pause size={14} />
              </button>
            ) : (
              <button
                onClick={onStartSim}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--elastic-teal)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Start Simulation"
              >
                <Play size={14} />
              </button>
            )}

            <button
              onClick={onStopSim}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--elastic-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Stop Simulation"
            >
              <Square size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav style={{
        display: 'flex',
        gap: '4px',
        padding: '0 24px',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--elastic-teal)' : '2px solid transparent',
                color: isActive ? 'var(--elastic-teal)' : 'var(--elastic-text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--elastic-text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--elastic-text-secondary)';
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
