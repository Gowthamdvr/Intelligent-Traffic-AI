import React, { useState, useEffect, useRef } from 'react';

// Reusable Video Player Component for different sources
function VideoPlayer({ sourceUrl, onStatsUpdate }) {
  const [frameData, setFrameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(sourceUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to stream:', sourceUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFrameData(data.image);
        if (onStatsUpdate) onStatsUpdate(data.stats);
      } catch (e) { console.error(e); }
    };

    ws.onclose = () => setIsConnected(false);

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [sourceUrl, onStatsUpdate]); // Added onStatsUpdate to dependency array

  return (
    <div className="video-section">
      {frameData ? (
        <img src={`data:image/jpeg;base64,${frameData}`} alt="Stream" className="video-feed" />
      ) : (
        <div style={{ color: '#8b949e', padding: '2rem' }}>
          {isConnected ? 'Waiting for frames...' : 'Connecting to stream...'}
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'uploads', 'admin'
  const [liveSource, setLiveSource] = useState('webcam');

  // LIVE STATE
  const [liveStats, setLiveStats] = useState({
    total_vehicles: 0,
    density: 'Loading...',
    breakdown: { Car: 0, Bike: 0, Bus: 0, Truck: 0, Person: 0 },
    alert: null,
    signal_state: 'GREEN'
  });

  // UPLOAD STATE
  const [imageFile, setImageFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadedVideoName, setUploadedVideoName] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);

  const [logs, setLogs] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const lastAlertRef = useRef(null);

  // Poll for logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'admin') {
        fetch('http://localhost:8000/logs')
          .then(res => res.json())
          .then(data => setLogs(data))
          .catch(console.error);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Alert Text-to-Speech global listener (monitoring liveStats mostly)
  useEffect(() => {
    const currentAlert = activeTab === 'live' ? liveStats.alert : (uploadStats?.alert);

    if (currentAlert && voiceEnabled) {
      if (lastAlertRef.current !== currentAlert) {
        const utterance = new SpeechSynthesisUtterance(currentAlert);
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
        lastAlertRef.current = currentAlert;
        setTimeout(() => { lastAlertRef.current = null; }, 5000);
      }
    }
  }, [liveStats, uploadStats, voiceEnabled, activeTab]);

  const handleImageUpload = async () => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const res = await fetch('http://localhost:8000/analyze/image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setImageResult(data);
    } catch (err) {
      console.error(err);
      alert('Error analyzing image');
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      const res = await fetch('http://localhost:8000/upload/video', { method: 'POST', body: formData });
      const data = await res.json();
      setUploadedVideoName(data.filename);
    } catch (err) {
      console.error(err);
      alert('Error uploading video');
    }
  };

  // Helper to render stats cards
  const StatsPanel = ({ stats }) => {
    if (!stats) return null;
    return (
      <aside className="dashboard-sidebar">
        <div className="card">
          <div className="card-title">Total Objects</div>
          <div className="metric-value">{stats.total_vehicles}<span className="metric-unit">detected</span></div>
        </div>
        <div className="card">
          <div className="card-title">Traffic Density</div>
          <div className={`density-badge density-${stats.density.toLowerCase()}`}>{stats.density.toUpperCase()}</div>
        </div>
        <div className="card">
          <div className="card-title">Alerts</div>
          <div className="alerts-container">
            {stats.alert ? <div className="alert-message"><strong>WARNING:</strong> {stats.alert}</div> : <div style={{ color: '#8b949e' }}>No active alerts.</div>}
          </div>

          <div className="toggle-wrapper" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #30363d' }}>
            <input type="checkbox" id="voice-toggle" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
            <label htmlFor="voice-toggle" className="toggle-label">Enable Voice Alerts</label>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo">AI <span>TRAFFIC</span> GUARD</div>
        <div className="tabs" style={{ marginLeft: '2rem', marginBottom: 0, borderBottom: 'none' }}>
          <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>Live Monitor</button>
          <button className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`} onClick={() => setActiveTab('uploads')}>Upload Analysis</button>
          <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Admin Dashboard</button>
        </div>
        <div className="status-indicator">
          <div className={`pulse`} style={{ backgroundColor: '#238636' }}></div> SYSTEM ONLINE
        </div>
      </header>

      <main>
        {activeTab === 'live' && (
          <>
            {/* Live Webcam Stream */}
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Camera Source (0, rtsp://..., or filename)"
                  defaultValue="webcam"
                  onBlur={(e) => {
                    // Simple way to force reload video player with new source
                    const newSource = e.target.value || "webcam";
                    // We use a key trick or just state to trigger re-render if needed, 
                    // but simpler is to just reload the page or use a state for sourceUrl
                    // Let's use internal state for this component if we were refactoring, 
                    // but here we can just do a window reload or better, lift source state.
                    // Ideally, we'd update a state variable `liveSource`.
                    // For this snippet, I'll assume an implementation that uses state below.
                    setLiveSource(newSource);
                  }}
                  style={{
                    background: '#161b22', border: '1px solid #30363d', color: '#e6edf3',
                    padding: '5px 10px', borderRadius: '4px', width: '300px'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#8b949e', alignSelf: 'center' }}>
                  (Hit Enter/Blur to apply)
                </span>
              </div>

              <VideoPlayer
                sourceUrl={`ws://localhost:8000/ws/video?source=${encodeURIComponent(liveSource)}`}
                onStatsUpdate={setLiveStats}
              />
              <div style={{
                position: 'absolute', top: '3rem', right: '1rem',
                background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '5px',
                border: `2px solid ${liveStats.signal_state === 'GREEN' ? '#238636' : '#da3633'}`,
                color: liveStats.signal_state === 'GREEN' ? '#238636' : '#da3633', fontWeight: 'bold'
              }}>
                SIGNAL: {liveStats.signal_state}
              </div>
            </div>
            <StatsPanel stats={liveStats} />
          </>
        )}

        {activeTab === 'uploads' && (
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%' }}>

            {/* Image Section */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' }}>Image Analysis</h3>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              <button
                onClick={handleImageUpload}
                disabled={!imageFile}
                style={{ padding: '10px', background: 'var(--accent-color)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
              >
                Analyze Image
              </button>

              {imageResult && (
                <div style={{ marginTop: '1rem', overflowY: 'auto' }}>
                  <img src={`data:image/jpeg;base64,${imageResult.image}`} style={{ width: '100%', borderRadius: '8px' }} alt="Result" />
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                    <div><strong>Density:</strong> {imageResult.stats.density}</div>
                    <div><strong>Count:</strong> {imageResult.stats.total_vehicles}</div>
                    {imageResult.stats.alert && <div style={{ color: 'var(--danger-color)' }}><strong>Alert:</strong> {imageResult.stats.alert}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Video Section */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' }}>Video Analysis</h3>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
              <button
                onClick={handleVideoUpload}
                disabled={!videoFile}
                style={{ padding: '10px', background: 'var(--accent-color)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
              >
                Upload & Process Video
              </button>

              {uploadedVideoName && (
                <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--success-color)' }}>Processing: {uploadedVideoName}</div>
                  <VideoPlayer
                    sourceUrl={`ws://localhost:8000/ws/video?source=${uploadedVideoName}`}
                    onStatsUpdate={setUploadStats}
                  />
                  {uploadStats && (
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                      <div><strong>Density:</strong> {uploadStats.density}</div>
                      <div><strong>Count:</strong> {uploadStats.total_vehicles}</div>
                      {uploadStats.alert && <div style={{ color: 'var(--danger-color)' }}><strong>Alert:</strong> {uploadStats.alert}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'admin' && (
          <section className="admin-panel" style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ marginBottom: '1rem' }}>Traffic Violation Logs & History</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Density</th>
                    <th>Total Vehicles</th>
                    <th>Alert Type</th>
                    <th>Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`signal-indicator density-${log.density_status?.toLowerCase() || 'low'}`}>
                          {log.density_status}
                        </span>
                      </td>
                      <td>{log.total_vehicles}</td>
                      <td style={{ color: log.alert_type ? '#da3633' : 'inherit' }}>
                        {log.alert_type || '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {JSON.stringify(log.vehicle_breakdown)}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No logs found yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
