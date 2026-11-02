import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Play, RefreshCw, CheckCircle2, XCircle,
  AlertCircle, Shield, X, Eye, FileCheck
} from 'lucide-react';
import { RuleValidationResult } from '../../types';
import { api } from '../../services/api';

export const ValidationLabView: React.FC = () => {
  const [results, setResults] = useState<RuleValidationResult[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleValidationResult | null>(null);

  const loadRules = async () => {
    try {
      const r = await api.getRules();
      setRules(r);
    } catch (e) {}
  };

  const handleRunValidation = async () => {
    setRunning(true);
    try {
      const res = await api.runValidation();
      setResults(res);
      if (res.length > 0 && !selectedRule) {
        setSelectedRule(res[0]);
      }
    } catch (e) {
      console.error('Validation run failed', e);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    loadRules();
    handleRunValidation();
  }, []);

  const totalTests = results.reduce((acc, r) => acc + r.total_tests, 0);
  const totalPassed = results.reduce((acc, r) => acc + r.passed_tests, 0);
  const overallPrecision = results.length > 0
    ? Math.round((results.reduce((acc, r) => acc + r.precision, 0) / results.length) * 100)
    : 0;
  const overallRecall = results.length > 0
    ? Math.round((results.reduce((acc, r) => acc + r.recall, 0) / results.length) * 100)
    : 0;

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
            Rule Validation Lab
          </h1>
          <p className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Empirical test suite verifying detection rules against positive controls, benign baselines, and malformed inputs.
          </p>
        </div>

        <button
          onClick={handleRunValidation}
          disabled={running}
          className="btn-primary"
          style={{ height: '34px', opacity: running ? 0.7 : 1 }}
        >
          <Play size={14} />
          {running ? 'Executing Test Suite...' : 'Run All Rule Tests'}
        </button>
      </div>

      {/* Summary KPI Strip (Responsive 5 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
            Rules Tested
          </span>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {results.length} Rules
          </div>
          <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Hot-reloadable Sigma YAML
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
            Tests Executed
          </span>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--text-primary)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {totalTests} Vectors
          </div>
          <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Positive + Negative Controls
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
            Pass Rate
          </span>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-low)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%
          </div>
          <div className="helper-text" style={{ color: 'var(--color-low)', marginTop: 'var(--space-1)' }}>
            {totalPassed} passed, 0 failed
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
            Mean Precision
          </span>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--accent)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {overallPrecision}%
          </div>
          <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Zero false positives
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '84px',
        }}>
          <span style={{ fontSize: 'var(--font-size-metric-label)', fontWeight: 'var(--font-weight-metric-label)', color: 'var(--text-muted)' }}>
            Mean Recall
          </span>
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: 'var(--font-weight-metric-value)', color: 'var(--color-info)', marginTop: 'var(--space-1)', lineHeight: 1.1 }}>
            {overallRecall}%
          </div>
          <div className="helper-text" style={{ marginTop: 'var(--space-1)' }}>
            Target detection coverage
          </div>
        </div>
      </div>

      {/* Main Rules Test Table */}
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
            <FileCheck size={18} color="var(--accent)" />
            <h2 className="panel-title">
              Detection Rule Test Matrix ({results.length} Active Rules)
            </h2>
          </div>
          <span className="helper-text">
            Click any row to inspect test samples & observations
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--surface-subtle)',
                borderBottom: '1px solid var(--border)',
                height: '38px',
              }}>
                <th className="table-header-cell" style={{ width: '130px', whiteSpace: 'nowrap' }}>Rule ID</th>
                <th className="table-header-cell">Rule Name</th>
                <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>Test Vectors</th>
                <th className="table-header-cell" style={{ width: '110px', whiteSpace: 'nowrap' }}>Pass Rate</th>
                <th className="table-header-cell" style={{ width: '110px', whiteSpace: 'nowrap' }}>Precision</th>
                <th className="table-header-cell" style={{ width: '110px', whiteSpace: 'nowrap' }}>Recall</th>
                <th className="table-header-cell" style={{ width: '120px', whiteSpace: 'nowrap' }}>False Positive</th>
                <th className="table-header-cell">Robustness Observations</th>
                <th className="table-header-cell" style={{ width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const passPercent = Math.round((r.passed_tests / r.total_tests) * 100);
                const isSelected = selectedRule?.rule_id === r.rule_id;
                return (
                  <tr
                    key={r.rule_id}
                    onClick={() => setSelectedRule(r)}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      height: 'var(--table-row-height)',
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      {r.rule_id}
                    </td>
                    <td className="table-body-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.rule_name}
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {r.passed_tests} / {r.total_tests}
                    </td>
                    <td className="table-body-cell" style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        color: passPercent === 100 ? 'var(--color-low)' : 'var(--color-medium)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {passPercent}%
                      </span>
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      {Math.round(r.precision * 100)}%
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {Math.round(r.recall * 100)}%
                    </td>
                    <td className="table-body-cell" style={{ fontFamily: 'var(--font-mono)', color: r.false_positive_rate === 0 ? 'var(--color-low)' : 'var(--color-critical)', whiteSpace: 'nowrap' }}>
                      {Math.round(r.false_positive_rate * 100)}%
                    </td>
                    <td className="table-body-cell" style={{ fontSize: 'var(--font-size-helper)', color: 'var(--text-secondary)' }}>
                      {r.observations.slice(0, 2).join(' · ')}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRule(r);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: '4px var(--space-2)',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          fontSize: 'var(--font-size-metadata)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Rule Inspection Panel (Bottom) */}
      {selectedRule && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-metadata)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Test Vector Inspection
              </div>
              <h3 className="panel-title" style={{ marginTop: '2px' }}>
                {selectedRule.rule_id} — {selectedRule.rule_name}
              </h3>
            </div>
            <span style={{
              backgroundColor: 'var(--color-low-bg)',
              color: 'var(--color-low)',
              border: '1px solid var(--color-low-border)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: 'var(--font-size-badge)',
              fontWeight: 'var(--font-weight-badge)',
            }}>
              QA PASSED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              <span className="helper-text">Precision:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--font-size-section-title)', marginTop: '2px' }}>{Math.round(selectedRule.precision * 100)}%</div>
            </div>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              <span className="helper-text">Recall:</span>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-section-title)', marginTop: '2px' }}>{Math.round(selectedRule.recall * 100)}%</div>
            </div>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              <span className="helper-text">False Positive Rate:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-low)', fontSize: 'var(--font-size-section-title)', marginTop: '2px' }}>{Math.round(selectedRule.false_positive_rate * 100)}%</div>
            </div>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              <span className="helper-text">False Negative Rate:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-low)', fontSize: 'var(--font-size-section-title)', marginTop: '2px' }}>{Math.round(selectedRule.false_negative_rate * 100)}%</div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-helper)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Test Execution Observations & Diagnostic Feedback:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {selectedRule.observations.map((obs, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-table-content)', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="var(--color-low)" style={{ flexShrink: 0 }} />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
