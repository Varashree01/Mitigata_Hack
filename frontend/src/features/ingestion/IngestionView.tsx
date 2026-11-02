import React, { useState, useEffect } from 'react';
import { Upload, FileCode, Check, AlertCircle, Database, HardDrive, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const IngestionView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceHint, setSourceHint] = useState<string>('auto');
  const [uploading, setUploading] = useState<boolean>(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchRuns = async () => {
    try {
      const data = await api.getIngestionRuns();
      setRuns(data);
    } catch (e) {
      console.error('Failed to fetch runs', e);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const res = await api.uploadLogFile(file, sourceHint);
      setMessage({ text: `Successfully ingested batch: ${res.run?.processed_events || 0} events normalized into DuckDB.` });
      setFile(null);
      await fetchRuns();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || 'Failed to ingest log file.', error: true });
    } finally {
      setUploading(false);
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
    }}>
      {/* Consistent Left-Aligned Header */}
      <div>
        <h1 className="page-title">
          Data Ingestion
        </h1>
        <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
          Chunked log pipeline supporting CSV, JSON, Sysmon, and Linux syslog ingestion into DuckDB.
        </p>
      </div>

      {/* Upload Zone & Config Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 'var(--space-5)',
      }}>
        {/* Drag and Drop Upload Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 className="panel-title" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Upload size={18} color="var(--accent)" />
            Log Batch Ingestion Dropzone
          </h2>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Dashed Drop Container */}
            <div style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6) var(--space-5)',
              textAlign: 'center',
              backgroundColor: 'var(--surface-subtle)',
              cursor: 'pointer',
              position: 'relative',
            }}>
              <input
                type="file"
                accept=".csv,.json,.jsonl,.log,.txt"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <FileCode size={30} color="var(--accent)" style={{ margin: '0 auto var(--space-2)' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-body)', color: 'var(--text-primary)' }}>
                {file ? file.name : 'Choose a log dataset or drag and drop here'}
              </div>
              <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
                Supports CSV, JSON Lines (.jsonl), Windows Event Log dumps, and Linux auth logs
              </div>
            </div>

            {/* Parser Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-helper)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Telemetry Parser Preset
                </label>
                <select
                  value={sourceHint}
                  onChange={(e) => setSourceHint(e.target.value)}
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
                  <option value="auto">Auto-detect from schema</option>
                  <option value="windows_sysmon">Windows Sysmon / Security Logs</option>
                  <option value="linux_auth">Linux Auth (/var/log/auth.log)</option>
                  <option value="zeek">Zeek Network Telemetry</option>
                  <option value="suricata">Suricata EVE JSON</option>
                  <option value="csv_feed">Generic CSV Log Feed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-helper)', fontWeight: 600, color: 'transparent', marginBottom: 'var(--space-1)' }}>
                  Submit
                </label>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  style={{
                    width: '100%',
                    padding: '8px var(--space-4)',
                    backgroundColor: 'var(--accent)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'var(--font-weight-btn)',
                    fontSize: 'var(--font-size-btn)',
                    cursor: file && !uploading ? 'pointer' : 'not-allowed',
                    opacity: file && !uploading ? 1 : 0.6,
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  {uploading ? 'Parsing...' : 'Ingest Batch'}
                </button>
              </div>
            </div>

            {message && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: message.error ? 'var(--color-critical-bg)' : 'var(--accent-subtle)',
                border: `1px solid ${message.error ? 'var(--color-critical-border)' : 'var(--accent-border)'}`,
                fontSize: 'var(--font-size-helper)',
                color: message.error ? 'var(--color-critical)' : 'var(--accent)',
              }}>
                {message.text}
              </div>
            )}
          </form>
        </div>

        {/* Ingestion Engine Architecture Specifications */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <HardDrive size={18} color="var(--text-muted)" />
            Pipeline Scalability Architecture
          </h2>

          <div className="helper-text" style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            To satisfy the <strong>Core (15 GB)</strong>, <strong>Advanced (30 GB)</strong>, and <strong>Extreme (50 GB)</strong> competition tiers on a single laptop:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px var(--space-3)', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', fontSize: 'var(--font-size-table-content)' }}>
              <Check size={16} color="var(--color-low)" style={{ flexShrink: 0 }} />
              <span><strong>Chunked Batch Processing:</strong> Logs are parsed in 5,000-event generator chunks.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px var(--space-3)', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', fontSize: 'var(--font-size-table-content)' }}>
              <Check size={16} color="var(--color-low)" style={{ flexShrink: 0 }} />
              <span><strong>DuckDB Parquet Columnar:</strong> Analytical queries run on compressed disk files.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px var(--space-3)', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', fontSize: 'var(--font-size-table-content)' }}>
              <Check size={16} color="var(--color-low)" style={{ flexShrink: 0 }} />
              <span><strong>Strict Memory Bound:</strong> Peak heap RAM remains &lt; 2.5 GB regardless of file size.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion Execution History Table */}
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
            <Database size={16} color="var(--accent)" />
            <h3 className="panel-title">
              Ingestion Execution History
            </h3>
          </div>
          <span className="helper-text">
            Stored in DuckDB & Parquet partition storage
          </span>
        </div>

        {runs.length === 0 ? (
          <div style={{ padding: 'var(--space-8) var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No log files ingested yet. Use the upload dropzone above to process log datasets.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderBottom: '1px solid var(--border)',
                  height: '38px',
                }}>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Run ID</th>
                  <th className="table-header-cell">Filename</th>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Source Format</th>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Events Processed</th>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Duration</th>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Status</th>
                  <th className="table-header-cell" style={{ whiteSpace: 'nowrap' }}>Executed At</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr
                    key={r.run_id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      height: 'var(--table-row-height)',
                    }}
                  >
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      {r.run_id}
                    </td>
                    <td className="table-body-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.filename}
                    </td>
                    <td className="table-body-cell" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {r.source_type}
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {r.processed_events.toLocaleString()}
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {r.duration_seconds}s
                    </td>
                    <td className="table-body-cell">
                      <span style={{
                        color: r.status === 'completed' ? 'var(--color-low)' : 'var(--color-critical)',
                        fontWeight: 'var(--font-weight-badge)',
                        fontSize: 'var(--font-size-badge)',
                        backgroundColor: r.status === 'completed' ? 'var(--color-low-bg)' : 'var(--color-critical-bg)',
                        border: `1px solid ${r.status === 'completed' ? 'var(--color-low-border)' : 'var(--color-critical-border)'}`,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        textTransform: 'capitalize',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="table-body-cell" style={{ fontSize: 'var(--font-size-metadata)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {r.created_at?.substring(0, 19)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
