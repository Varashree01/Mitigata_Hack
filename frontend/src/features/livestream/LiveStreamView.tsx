import React, { useState, useEffect, useRef } from 'react';
import {
  Radio, Play, Pause, Square, RotateCcw, AlertTriangle,
  Search, Filter, Server, Shield, CheckCircle, Clock, X, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export const LiveStreamView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState('scenario_1');
  const [rate, setRate] = useState(5);
  const [simStatus, setSimStatus] = useState('stopped');
  const [eventsLog, setEventsLog] = useState<any[]>([]);
  const [stats, setStats] = useState({ emitted: 0, detections: 0, incidents: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [inspectedEvent, setInspectedEvent] = useState<any | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const refreshStatus = async () => {
    try {
      const res = await api.getSimulationStatus();
      setSimStatus(res.status);
      setStats((prev) => ({ ...prev, emitted: res.events_emitted }));
    } catch (e) {}
  };

  useEffect(() => {
    refreshStatus();
    const timer = setInterval(refreshStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket connection for real-time live events
  useEffect(() => {
    const wsUrl = 'ws://localhost:8000/api/simulation/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'event_update') {
          setEventsLog((prev) => [data, ...prev.slice(0, 199)]);
          setStats((prev) => ({
            emitted: data.events_emitted,
            detections: prev.detections + (data.new_detections?.length || 0),
            incidents: prev.incidents + (data.updated_incidents?.length || 0),
          }));
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleStart = async () => {
    await api.startSimulation(selectedScenario, rate);
    setSimStatus('running');
  };

  const handlePause = async () => {
    await api.pauseSimulation();
    setSimStatus('paused');
  };

  const handleResume = async () => {
    await api.resumeSimulation();
    setSimStatus('running');
  };

  const handleStop = async () => {
    await api.stopSimulation();
    setSimStatus('stopped');
  };

  const handleReset = async () => {
    await api.resetSimulation();
    setEventsLog([]);
    setStats({ emitted: 0, detections: 0, incidents: 0 });
    setSimStatus('stopped');
    setInspectedEvent(null);
  };

  // Filter events
  const filteredEvents = eventsLog.filter((item) => {
    const ev = item.event;
    if (filterType === 'attacks' && !item.is_attack && (!item.new_detections || item.new_detections.length === 0)) return false;
    if (filterType === 'detections' && (!item.new_detections || item.new_detections.length === 0)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHost = ev.host?.toLowerCase().includes(q);
      const matchUser = ev.user?.toLowerCase().includes(q);
      const matchMsg = ev.raw_reference?.toLowerCase().includes(q);
      const matchCmd = ev.command_line?.toLowerCase().includes(q);
      return matchHost || matchUser || matchMsg || matchCmd;
    }
    return true;
  });

  return (
    <div style={{
      height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      overflow: 'hidden',
    }}>
      {/* Primary Left Region: Live Telemetry Event Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
      }}>
        {/* Top Stream Filter Bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: 'var(--surface-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '420px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              width: '100%',
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter by host, user, or command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Show:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Telemetry</option>
              <option value="attacks">Planted Attack Steps</option>
              <option value="detections">Threat Detections Only</option>
            </select>

            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ({filteredEvents.length} buffer)
            </span>
          </div>
        </div>

        {/* Live Events Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                height: '38px',
                zIndex: 5,
              }}>
                <th className="table-header-cell" style={{ width: '100px', whiteSpace: 'nowrap' }}>Timestamp</th>
                <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>Classification</th>
                <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>Host</th>
                <th className="table-header-cell" style={{ width: '110px', whiteSpace: 'nowrap' }}>User</th>
                <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Action</th>
                <th className="table-header-cell">Log Detail / Process</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-table-content)' }}>
                    No events in stream buffer. Start the simulation to feed live telemetry.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item, idx) => {
                  const ev = item.event;
                  const isAttack = item.is_attack;
                  const hasDets = item.new_detections && item.new_detections.length > 0;
                  const isSelected = inspectedEvent?.event_id === ev.event_id;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setInspectedEvent(ev)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        height: 'var(--table-row-height)',
                        backgroundColor: isSelected
                          ? 'var(--accent-subtle)'
                          : (hasDets ? 'var(--color-critical-bg)' : (isAttack ? '#F0F9FF' : 'transparent')),
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = hasDets ? 'var(--color-critical-bg)' : (isAttack ? '#F0F9FF' : 'transparent');
                        }
                      }}
                    >
                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {ev.timestamp.split('T')[1]?.substring(0, 8)}
                      </td>

                      <td className="table-body-cell" style={{ whiteSpace: 'nowrap' }}>
                        {hasDets ? (
                          <span style={{
                            backgroundColor: 'var(--color-critical)',
                            color: '#FFFFFF',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 'var(--font-size-badge)',
                            fontWeight: 'var(--font-weight-badge)',
                          }}>
                            DETECTION
                          </span>
                        ) : isAttack ? (
                          <span style={{
                            backgroundColor: 'var(--accent)',
                            color: '#FFFFFF',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 'var(--font-size-badge)',
                            fontWeight: 'var(--font-weight-badge)',
                          }}>
                            ATTACK
                          </span>
                        ) : (
                          <span className="metadata-text">
                            Telemetry
                          </span>
                        )}
                      </td>

                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {ev.host || '—'}
                      </td>

                      <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {ev.user || 'system'}
                      </td>

                      <td className="table-body-cell" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {ev.action}
                      </td>

                      <td className="table-body-cell" style={{ maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hasDets ? (
                          <span style={{ color: 'var(--color-critical)', fontWeight: 600 }}>
                            {item.new_detections[0].rule_name}: {ev.command_line || ev.raw_reference}
                          </span>
                        ) : (
                          <span>{ev.command_line || ev.raw_reference}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Event Context Drawer (Bottom Strip) */}
        {inspectedEvent && (
          <div style={{
            borderTop: '1px solid var(--border-strong)',
            backgroundColor: 'var(--surface-subtle)',
            padding: '14px 20px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Selected Event: {inspectedEvent.event_id}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {inspectedEvent.timestamp}
                </span>
              </div>
              <button onClick={() => setInspectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '10px',
              borderRadius: 'var(--radius-xs)',
              overflowX: 'auto',
            }}>
              {JSON.stringify(inspectedEvent, null, 2)}
            </div>
          </div>
        )}
      </div>

      {/* Right Control & Diagnostics Sidebar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px',
        gap: '20px',
      }}>
        {/* Stream Playback Card */}
        <div style={{
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span className="panel-title">
              Stream Controls
            </span>
            <span style={{
              fontSize: 'var(--font-size-badge)',
              fontWeight: 'var(--font-weight-badge)',
              textTransform: 'uppercase',
              color: simStatus === 'running' ? 'var(--color-low)' : 'var(--color-medium)',
              letterSpacing: '0.04em',
            }}>
              {simStatus}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {simStatus === 'running' ? (
              <button
                onClick={handlePause}
                className="btn-secondary"
                style={{ flex: 1, backgroundColor: 'var(--color-medium-bg)', color: 'var(--color-medium)', borderColor: 'var(--color-medium-border)' }}
              >
                <Pause size={14} /> Pause
              </button>
            ) : simStatus === 'paused' ? (
              <button
                onClick={handleResume}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                <Play size={14} /> Resume
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                <Play size={14} /> Start Stream
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={simStatus === 'stopped'}
              className="btn-secondary"
              style={{
                width: '36px',
                padding: 0,
                color: simStatus !== 'stopped' ? 'var(--color-critical)' : 'var(--text-subtle)',
                cursor: simStatus !== 'stopped' ? 'pointer' : 'not-allowed',
              }}
              title="Stop stream"
            >
              <Square size={14} />
            </button>

            <button
              onClick={handleReset}
              title="Reset Database"
              className="btn-secondary"
              style={{ width: '36px', padding: 0 }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Rate Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Throughput Cadence:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {rate} Events / Sec
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Attack Scenario Selection Cards */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Active Scenario
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Scenario 1 */}
            <div
              onClick={() => setSelectedScenario('scenario_1')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${selectedScenario === 'scenario_1' ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: selectedScenario === 'scenario_1' ? 'var(--accent-subtle)' : 'var(--surface-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: selectedScenario === 'scenario_1' ? 'var(--accent)' : 'var(--text-primary)' }}>
                Scenario 1: Retail Breach (INC-01)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Vendor spray → HR-07 → LSASS Dump → Lateral SMB → FS-02 → Exfil.
              </div>
            </div>

            {/* Scenario 2 */}
            <div
              onClick={() => setSelectedScenario('scenario_2')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${selectedScenario === 'scenario_2' ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: selectedScenario === 'scenario_2' ? 'var(--accent-subtle)' : 'var(--surface-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: selectedScenario === 'scenario_2' ? 'var(--accent)' : 'var(--text-primary)' }}>
                Scenario 2: Phishing C2 Beacon
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Encoded PowerShell on WS-FIN-12 → Outbound C2 beaconing.
              </div>
            </div>

            {/* Scenario 3 */}
            <div
              onClick={() => setSelectedScenario('scenario_3')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${selectedScenario === 'scenario_3' ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: selectedScenario === 'scenario_3' ? 'var(--accent-subtle)' : 'var(--surface-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: selectedScenario === 'scenario_3' ? 'var(--accent)' : 'var(--text-primary)' }}>
                Scenario 3: Domain Controller Pivot
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Active Directory discovery via nltest → IPC session to DC-01.
              </div>
            </div>
          </div>
        </div>

        {/* Stream Telemetry Vitals */}
        <div style={{
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Live Stream Counters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Events Emitted:</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.emitted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Triggered Detections:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-high)', fontFamily: 'var(--font-mono)' }}>{stats.detections}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Correlated Incidents:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>{stats.incidents}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
