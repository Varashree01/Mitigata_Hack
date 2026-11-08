import React, { useState, useEffect } from 'react';
import './styles/tokens.css';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenter } from './features/dashboard/CommandCenter';
import { LiveStreamView } from './features/livestream/LiveStreamView';
import { InvestigationView } from './features/investigation/InvestigationView';
import { ExposureView } from './features/exposure/ExposureView';
import { IngestionView } from './features/ingestion/IngestionView';
import { ValidationLabView } from './features/validation/ValidationLabView';
import { TelemetryCoverageView } from './features/telemetry/TelemetryCoverageView';
import { ReportsView } from './features/reports/ReportsView';
import { EvaluationView } from './features/evaluation/EvaluationView';
import { SettingsView } from './features/settings/SettingsView';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [simStatus, setSimStatus] = useState<string>('stopped');
  const [activeIncidentsCount, setActiveIncidentsCount] = useState<number>(0);

  const pollSystemStatus = async () => {
    try {
      const [tData, sData] = await Promise.all([
        api.getTelemetry(),
        api.getSimulationStatus()
      ]);
      setActiveIncidentsCount(tData.active_incidents || 0);
      setSimStatus(sData.status || 'stopped');
    } catch (e) {
      // Background poll failure is non-fatal
    }
  };

  useEffect(() => {
    pollSystemStatus();
    const interval = setInterval(pollSystemStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSim = async () => {
    try {
      await api.startSimulation('scenario_1', 4);
      setSimStatus('running');
    } catch (e) {
      console.error('Failed to start simulation', e);
    }
  };

  const handlePauseSim = async () => {
    try {
      await api.pauseSimulation();
      setSimStatus('paused');
    } catch (e) {
      console.error('Failed to pause simulation', e);
    }
  };

  const handleStopSim = async () => {
    try {
      await api.stopSimulation();
      setSimStatus('stopped');
    } catch (e) {
      console.error('Failed to stop simulation', e);
    }
  };

  const handleInvestigateIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('investigation');
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--app-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeIncidentsCount={activeIncidentsCount}
      />

      {/* Main Workspace Frame */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Top Operational Context Header */}
        <Header
          currentTab={currentTab}
          simStatus={simStatus}
          onStartSim={handleStartSim}
          onPauseSim={handlePauseSim}
          onStopSim={handleStopSim}
          activeIncidentsCount={activeIncidentsCount}
        />

        {/* Viewport View Switcher */}
        <main style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'var(--app-bg)',
        }}>
          {(currentTab === 'dashboard' || currentTab === 'incidents') && (
            <CommandCenter
              onRunDemo={handleStartSim}
              onAnalyzeLogs={() => setCurrentTab('ingestion')}
              simStatus={simStatus}
            />
          )}
          {currentTab === 'livestream' && (
            <LiveStreamView />
          )}
          {currentTab === 'investigation' && (
            <InvestigationView initialIncidentId={selectedIncidentId} />
          )}
          {currentTab === 'exposure' && (
            <ExposureView />
          )}
          {currentTab === 'ingestion' && (
            <IngestionView />
          )}
          {currentTab === 'telemetry' && (
            <TelemetryCoverageView />
          )}
          {currentTab === 'validation' && (
            <ValidationLabView />
          )}
          {currentTab === 'reports' && (
            <ReportsView />
          )}
          {currentTab === 'evaluation' && (
            <EvaluationView />
          )}
          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
