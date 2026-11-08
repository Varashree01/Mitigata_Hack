import React from 'react';
import {
  LayoutDashboard, Radio, GitBranch, ShieldAlert, Crosshair,
  Database, Radar, CheckSquare, FileText, Cpu, Settings,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeIncidentsCount: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  activeIncidentsCount,
}) => {
  const groups: NavGroup[] = [
    {
      groupName: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
      ],
    },
    {
      groupName: 'INVESTIGATION',
      items: [
        { id: 'livestream', label: 'Live Event Stream', icon: Radio },
        { id: 'investigation', label: 'Attack Graph', icon: GitBranch },
        { id: 'incidents', label: 'Incidents', icon: ShieldAlert, badge: activeIncidentsCount },
      ],
    },
    {
      groupName: 'EXPOSURE INTELLIGENCE',
      items: [
        { id: 'exposure', label: 'Forward Reachability', icon: Crosshair },
      ],
    },
    {
      groupName: 'DATA MANAGEMENT',
      items: [
        { id: 'ingestion', label: 'Data Ingestion', icon: Database },
        { id: 'telemetry', label: 'Telemetry Coverage', icon: Radar },
      ],
    },
    {
      groupName: 'DETECTION',
      items: [
        { id: 'validation', label: 'Rule Validation Lab', icon: CheckSquare },
      ],
    },
    {
      groupName: 'ANALYSIS',
      items: [
        { id: 'reports', label: 'Forensic Reports', icon: FileText },
        { id: 'evaluation', label: 'Benchmarks & Evaluation', icon: Cpu },
      ],
    },
    {
      groupName: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
      height: '100%',
      backgroundColor: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none',
    }}>
      {/* Brand Header */}
      <div style={{
        height: 'var(--header-height)',
        padding: collapsed ? '0 var(--space-4)' : '0 var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
        }}>
          <Shield size={18} strokeWidth={2.4} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '17px',
              letterSpacing: '-0.02em',
              color: '#f5e4cc',
              lineHeight: 1.2,
            }}>
              Tracx
            </div>
            <div style={{
              fontSize: 'var(--font-size-metadata)',
              color: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              Kill Chain Intelligence
            </div>
          </div>
        )}
      </div>

      {/* Nav List with Groups */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 'var(--space-3) var(--space-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}>
        {groups.map((group) => (
          <div key={group.groupName}>
            {!collapsed && (
              <div style={{
                fontSize: 'var(--font-size-metadata)',
                fontWeight: 600,
                color: '#a39778',
                letterSpacing: '0.05em',
                padding: 'var(--space-1) var(--space-3)',
                textTransform: 'uppercase',
              }}>
                {group.groupName}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === 'incidents' && currentTab === 'dashboard_incidents');
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id === 'incidents' ? 'dashboard' : item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      width: '100%',
                      height: 'var(--sidebar-row-height)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      padding: collapsed ? '0' : '0 var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'rgba(99, 159, 92, 0.18)' : 'transparent',
                      color: isActive ? '#b9dcae' : '#d8cfb3',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sidebar-nav)',
                      fontWeight: isActive ? 600 : 'var(--font-weight-sidebar-nav)',
                      transition: 'background-color 0.12s ease, color 0.12s ease',
                      position: 'relative',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        e.currentTarget.style.color = '#f5e4cc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#d8cfb3';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                    </div>

                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        backgroundColor: 'var(--color-critical)',
                        color: '#FFFFFF',
                        fontSize: 'var(--font-size-badge)',
                        fontWeight: 'var(--font-weight-badge)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        minWidth: '18px',
                        textAlign: 'center',
                        lineHeight: 1,
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '8px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-critical)',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div style={{
        height: '44px',
        padding: '0 var(--space-3)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <span style={{ fontSize: 'var(--font-size-metadata)', color: '#a39778' }}>
            v1.0.0 · Core 15GB
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
            color: '#a39778',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};
