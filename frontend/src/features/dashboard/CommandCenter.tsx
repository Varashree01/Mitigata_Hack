import React from 'react';
import { Database, FileUp, Play } from 'lucide-react';

interface CommandCenterProps {
  onRunDemo: () => void;
  onAnalyzeLogs: () => void;
  simStatus: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onRunDemo,
  onAnalyzeLogs,
  simStatus,
}) => (
  <div style={{
    height: '100%',
    overflowY: 'auto',
    padding: 'var(--space-8)',
    background: 'var(--app-bg)',
  }}>
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="metadata-text" style={{
          color: 'var(--accent)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Tracx workspace
        </div>
        <h1 className="page-title" style={{ marginTop: 'var(--space-2)', fontSize: '30px' }}>
          Overview
        </h1>
        <p className="helper-text" style={{ marginTop: 'var(--space-2)', fontSize: '14px' }}>
          Choose how you want to start your investigation.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 'var(--space-5)',
      }}>
        <button
          type="button"
          onClick={onRunDemo}
          disabled={simStatus === 'running'}
          style={{
            minHeight: '190px',
            padding: 'var(--space-6)',
            textAlign: 'left',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-subtle)',
            color: 'var(--text-primary)',
            cursor: simStatus === 'running' ? 'not-allowed' : 'pointer',
            opacity: simStatus === 'running' ? 0.7 : 1,
          }}
        >
          <span style={{
            width: '42px',
            height: '42px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: '#fff',
          }}>
            <Play size={20} fill="currentColor" />
          </span>
          <span style={{ display: 'block', marginTop: 'var(--space-5)', fontSize: '18px', fontWeight: 700 }}>
            Run live demo
          </span>
          <span className="helper-text" style={{ display: 'block', marginTop: 'var(--space-2)' }}>
            {simStatus === 'running'
              ? 'The generated demo scenario is running.'
              : 'Run the Python-generated demo data through the live detection pipeline.'}
          </span>
        </button>

        <button
          type="button"
          onClick={onAnalyzeLogs}
          style={{
            minHeight: '190px',
            padding: 'var(--space-6)',
            textAlign: 'left',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{
            width: '42px',
            height: '42px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-active)',
            color: 'var(--accent)',
          }}>
            <FileUp size={20} />
          </span>
          <span style={{ display: 'block', marginTop: 'var(--space-5)', fontSize: '18px', fontWeight: 700 }}>
            Analyze data log
          </span>
          <span className="helper-text" style={{ display: 'block', marginTop: 'var(--space-2)' }}>
            Upload CSV, JSON, JSONL, Sysmon, or syslog data for analysis.
          </span>
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-6)',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-helper)',
      }}>
        <Database size={14} />
        <span>Results appear in Incidents and Attack paths after processing.</span>
      </div>
    </div>
  </div>
);
