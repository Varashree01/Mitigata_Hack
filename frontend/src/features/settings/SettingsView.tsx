import React, { useState } from 'react';
import {
  Settings, Sliders, Database, Shield, RotateCcw,
  CheckCircle, Server, HardDrive, Cpu, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const [defaultRate, setDefaultRate] = useState(5);
  const [batchSize, setBatchSize] = useState(10000);
  const [correlationWindow, setCorrelationWindow] = useState(120);
  const [llmProvider, setLlmProvider] = useState('deterministic');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleResetDatabase = async () => {
    try {
      await api.resetSimulation();
      setResetSuccess(true);
      setConfirmModalOpen(false);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to reset', e);
    }
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: 'var(--space-6) var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      maxWidth: '1200px',
    }}>
      {/* Title */}
      <div>
        <h1 className="page-title">
          Platform Settings
        </h1>
        <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
          Streaming parameters, analytical storage engines, detection thresholds, and database maintenance.
        </p>
      </div>

      {resetSuccess && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--color-low-bg)',
          border: '1px solid var(--color-low-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-low)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-size-table-content)',
        }}>
          <CheckCircle size={16} />
          Database and in-memory correlation state reset successfully.
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Card 1: Ingestion & Pipeline */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 className="panel-title" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sliders size={18} color="var(--accent)" />
            Pipeline & Ingestion Parameters
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Chunk Batch Size (Events per Ingestion Pass)
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: 'var(--font-size-table-content)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="helper-text" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                Ensures memory boundedness during 15GB - 50GB tier processing.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Temporal Correlation Time Window (Minutes)
              </label>
              <input
                type="number"
                value={correlationWindow}
                onChange={(e) => setCorrelationWindow(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: 'var(--font-size-table-content)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="helper-text" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                Time window for clustering sequential detections into unified attack incidents.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Default Simulation Speed Multiplier
              </label>
              <input
                type="number"
                value={defaultRate}
                min="1"
                max="25"
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: 'var(--font-size-table-content)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="helper-text" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                Default events per second generated in live streaming scenarios.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Narrative Generation */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 className="panel-title" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Cpu size={18} color="var(--color-info)" />
            Attack Narrative & Reasoning Engine
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Narrative Generation Strategy
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: 'var(--font-size-table-content)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="deterministic">Deterministic Template Engine (Fast & Air-gapped)</option>
                <option value="gemini">Google Gemini 1.5 Flash (API Key Required)</option>
                <option value="openai">OpenAI GPT-4o Mini (API Key Required)</option>
              </select>
              <span className="helper-text" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                Deterministic mode requires no external API keys and guarantees zero hallucinations.
              </span>
            </div>

            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-helper)',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
            }}>
              <strong>Evidence-Based Assurance:</strong> LLM augmentation synthesizes explanations strictly grounded in observed forensic log artifacts and validated graph topologies.
            </div>
          </div>
        </div>

        {/* Card 3: Storage Engine Vitals */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 className="panel-title" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database size={18} color="var(--accent)" />
            Storage Engine & Analytics Architecture
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-table-content)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>DuckDB Analytical Engine:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>storage/events.duckdb</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>SQLite Incident Catalog:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>storage/incidents.db</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Graph Intelligence:</span>
              <span style={{ fontWeight: 600 }}>NetworkX MultiDiGraph</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Columnar Parquet Partitions:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-low)' }}>Snappy Compressed</span>
            </div>
          </div>
        </div>

        {/* Card 4: Database Maintenance & Reset */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 className="panel-title" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-critical)' }}>
            <RotateCcw size={18} color="var(--color-critical)" />
            Data Maintenance & System Reset
          </h2>

          <p className="helper-text" style={{ marginBottom: 'var(--space-4)' }}>
            Purges all live streaming buffers, generated incidents, and DuckDB event tables for clean benchmark re-runs.
          </p>

          <button
            onClick={() => setConfirmModalOpen(true)}
            style={{
              padding: '8px var(--space-4)',
              backgroundColor: 'var(--color-critical-bg)',
              color: 'var(--color-critical)',
              border: '1px solid var(--color-critical-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'var(--font-weight-btn)',
              fontSize: 'var(--font-size-btn)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'background-color 0.12s ease',
            }}
          >
            <RotateCcw size={14} /> Reset Analytical Databases
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            width: '440px',
            maxWidth: '90vw',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <AlertTriangle size={24} color="var(--color-critical)" />
              <h3 className="section-title">
                Confirm System Reset
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-table-content)', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: 'var(--space-5)' }}>
              Are you sure you want to clear all normalized logs, detected incidents, and provenance graphs? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setConfirmModalOpen(false)}
                style={{
                  padding: '7px var(--space-4)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-btn)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                style={{
                  padding: '7px var(--space-4)',
                  backgroundColor: 'var(--color-critical)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-btn)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
