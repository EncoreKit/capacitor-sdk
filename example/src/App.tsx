import React, { useState, useCallback, useEffect } from 'react';
import Encore from '@encorekit/capacitor';
import type {
  PurchaseRequestEvent,
  PurchaseCompleteEvent,
  PassthroughEvent,
} from '@encorekit/capacitor';

interface LogEntry {
  id: number;
  time: string;
  event: string;
  data?: string;
}

const API_KEY = 'pk_test_yr93u3skt5fgy99ame1pq3wx';
const USER_ID = 'demo_user_capacitor_001';

export default function App() {
  const [resultText, setResultText] = useState('No result yet');
  const [claimEnabled, setClaimEnabled] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((event: string, data?: string) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[Encore] ${event}${data ? `: ${data}` : ''}`);
    setLogs((prev) => [{ id: Date.now(), time, event, data }, ...prev]);
  }, []);

  useEffect(() => {
    async function init() {
      // Configure SDK
      await Encore.configure(API_KEY, { logLevel: 'debug' });
      addLog('configure', `apiKey=${API_KEY}`);

      // Register callbacks before any interaction
      await Encore.registerCallbacks();
      addLog('registerCallbacks', 'registered');

      // Identify demo user
      await Encore.identify(USER_ID, { subscriptionTier: 'free' });
      addLog('identify', `userId=${USER_ID}`);

      // Event listeners
      Encore.onPurchaseRequest(async (event: PurchaseRequestEvent) => {
        addLog('onPurchaseRequest', JSON.stringify(event));
        // Auto-complete for testing (in production, use your billing manager)
        try {
          await Encore.completePurchaseRequest(true);
          addLog('completePurchaseRequest', 'success=true');
        } catch (e) {
          addLog('completePurchaseRequest ERROR', String(e));
        }
      });

      Encore.onPurchaseComplete((event: PurchaseCompleteEvent) => {
        addLog('onPurchaseComplete', JSON.stringify(event));
      });

      Encore.onPassthrough((event: PassthroughEvent) => {
        addLog('onPassthrough', JSON.stringify(event));
      });
    }

    init().catch((e) => addLog('init ERROR', String(e)));
  }, [addLog]);

  const handleShowPlacement = useCallback(async () => {
    try {
      const result = await Encore.placement('demo').show();
      setResultText(JSON.stringify(result));
      addLog('placement.show', JSON.stringify(result));
    } catch (e) {
      setResultText(`Error: ${e}`);
      addLog('show ERROR', String(e));
    }
  }, [addLog]);

  const handleToggleClaim = useCallback(async () => {
    const next = !claimEnabled;
    try {
      await Encore.placements.setClaimEnabled(next);
      setClaimEnabled(next);
      addLog('setClaimEnabled', `${next}`);
    } catch (e) {
      addLog('setClaimEnabled ERROR', String(e));
    }
  }, [claimEnabled, addLog]);

  const handleReset = useCallback(async () => {
    try {
      await Encore.reset();
      setResultText('SDK reset');
      addLog('reset', 'SUCCESS');
    } catch (e) {
      addLog('reset ERROR', String(e));
    }
  }, [addLog]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Encore SDK Demo</h1>
      <p style={styles.subtitle}>User: {USER_ID}</p>

      {/* Actions */}
      <div style={styles.section}>
        <button style={styles.button} onClick={handleShowPlacement}>
          Show Placement
        </button>

        <p style={styles.resultText}>{resultText}</p>

        <button
          style={{
            ...styles.button,
            ...(claimEnabled ? styles.buttonDestructive : styles.buttonSuccess),
          }}
          onClick={handleToggleClaim}
        >
          {claimEnabled ? 'Disable Claim' : 'Enable Claim'}
        </button>

        <button
          style={{ ...styles.button, ...styles.buttonOutline }}
          onClick={handleReset}
        >
          Reset SDK
        </button>
      </div>

      {/* Event Log */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Event Log</h2>
        {logs.length === 0 ? (
          <p style={styles.emptyLog}>No events yet</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={styles.logEntry}>
              <span style={styles.logTime}>{log.time}</span>
              <span style={styles.logEvent}> {log.event}</span>
              {log.data && <p style={styles.logData}>{log.data}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, textAlign: 'center', margin: 0 },
  subtitle: { fontSize: 16, color: '#6a6d81', textAlign: 'center', marginBottom: 32 },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 12 },
  button: {
    display: 'block',
    width: '100%',
    backgroundColor: '#5671ff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 8,
  },
  buttonDestructive: { backgroundColor: '#ff5c5c' },
  buttonSuccess: { backgroundColor: '#34c759' },
  buttonOutline: {
    backgroundColor: 'transparent',
    border: '1px solid #5671ff',
    color: '#5671ff',
  },
  resultText: { fontSize: 16, textAlign: 'center', margin: '16px 0' },
  emptyLog: { color: '#6a6d81', fontStyle: 'italic' },
  logEntry: { borderBottom: '1px solid #f0f0f0', padding: '8px 0' },
  logTime: { fontSize: 12, color: '#6a6d81' },
  logEvent: { fontSize: 14, fontWeight: 600 },
  logData: { fontSize: 12, color: '#5671ff', fontFamily: 'monospace', marginTop: 2 },
};
