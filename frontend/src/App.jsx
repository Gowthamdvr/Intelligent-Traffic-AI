import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import {
  User, Car, Bike, Truck, Bus, LayoutDashboard, History, Database,
  TrendingUp, BarChart3, Clock, AlertTriangle
} from 'lucide-react';
import heroImage from './assets/hero.png';

// Reusable Video Player Component
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
  }, [sourceUrl, onStatsUpdate]);

  return (
    <div className="video-section">
      {frameData ? (
        <img src={`data:image/jpeg;base64,${frameData}`} alt="Stream" className="video-feed" />
      ) : (
        <div style={{ color: '#8b949e', padding: '2rem', textAlign: 'center' }}>
          <div className="pulse" style={{ margin: '0 auto 1rem', background: 'var(--accent-color)' }}></div>
          {isConnected ? 'Sourcing AI Feed...' : 'Initializing Neural Link...'}
        </div>
      )}
    </div>
  );
}

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="pulse" style={{ width: 10, height: 10 }}></span>
              Enterprise AI Solution
            </div>
            <h1 className="hero-title">
              Intelligent <br />
              Traffic Guard
            </h1>
            <p className="hero-description">
              Next-generation real-time traffic monitoring powered by YOLOv8 deep learning.
              Optimize city flow, detect incidents instantly, and leverage data-driven insights.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={onStart}>
                Launch Dashboard
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <button className="btn-secondary">View Documentation</button>
            </div>

            <div style={{ marginTop: '4rem', display: 'flex', gap: '3rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>99.8%</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Detection Accuracy</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>&lt; 30ms</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Latency</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>24/7</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Live Monitoring</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-container">
              <img src={heroImage} alt="AI Traffic Visualization" className="hero-image" />
              <div className="visual-stats">
                <div className="card-title">Live Analysis</div>
                <div className="stat-item">
                  <span>Vehicles</span>
                  <span style={{ color: 'var(--accent-color)' }}>84</span>
                </div>
                <div className="stat-bar"><div className="stat-fill" style={{ width: '70%' }}></div></div>
                <div className="stat-item" style={{ marginTop: '10px' }}>
                  <span>Flow Rate</span>
                  <span style={{ color: 'var(--success-color)' }}>Optimal</span>
                </div>
                <div className="stat-bar"><div className="stat-fill" style={{ width: '90%', background: 'var(--success-color)' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Features Section */}
      <section style={{ padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Core Capabilities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { title: 'Vehicle Classification', desc: 'Differentiate between cars, trucks, buses, and motorcycles with high precision.' },
            { title: 'Density Estimation', desc: 'Automatically calculate traffic load and provide real-time congestion alerts.' },
            { title: 'Cloud Sync', desc: 'Securely log incident data and traffic patterns for long-term urban planning.' }
          ].map((f, i) => (
            <div key={i} className="card" style={{ textAlign: 'left' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '10px', marginBottom: '1rem', opacity: 0.8 }}></div>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const AnalyticsDashboard = ({ data, loading }) => {
  if (loading) return <div className="loading-state">Syncing Intelligence...</div>;

  const vehicleColors = {
    Car: '#00d2ff',
    Bike: '#3a7bd5',
    Bus: '#f2709c',
    Truck: '#ff9472',
    Person: '#00f260'
  };

  const summaryEntries = Object.entries(data.summary || {});

  return (
    <div className="analytics-grid">
      <div className="summary-cards">
        {summaryEntries.length > 0 ? summaryEntries.map(([type, count]) => (
          <div className="analytics-card" key={type}>
            <div className="card-icon" style={{ color: vehicleColors[type] || 'var(--accent-color)' }}>
              {type === 'Car' && <Car size={24} />}
              {type === 'Bike' && <Bike size={24} />}
              {type === 'Bus' && <Bus size={24} />}
              {type === 'Truck' && <Truck size={24} />}
              {type === 'Person' && <User size={24} />}
            </div>
            <div className="card-info">
              <span className="card-label">24H {type} Total</span>
              <h2 className="card-value">{count.toLocaleString()}</h2>
            </div>
          </div>
        )) : (
          <div className="analytics-card" style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
            <span className="card-label">No data recorded in the last 24 hours</span>
          </div>
        )}
      </div>

      <div className="card chart-card">
        <div className="card-header">
          <TrendingUp size={20} style={{ color: 'var(--accent-color)' }} />
          <h3>Traffic Flow Trends (Last 24 Hours)</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <defs>
                {Object.entries(vehicleColors).map(([type, color]) => (
                  <linearGradient id={`color${type}`} key={type} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '10px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend />
              {Object.entries(vehicleColors).map(([type, color]) => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={color}
                  fillOpacity={1}
                  fill={`url(#color${type})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [liveSource, setLiveSource] = useState('webcam');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // DASHBOARD STATE
  const [liveStats, setLiveStats] = useState({
    total_vehicles: 0,
    density: 'Sensing...',
    breakdown: { Car: 0, Bike: 0, Bus: 0, Truck: 0, Person: 0 },
    alert: null,
    signal_state: 'GREEN'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadedVideoName, setUploadedVideoName] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ summary: {}, trends: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const lastAlertRef = useRef(null);

  // Poll for logs when in Admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !showLanding) {
      const fetchLogs = () => {
        fetch('http://localhost:8000/logs')
          .then(res => res.json())
          .then(data => setLogs(data))
          .catch(console.error);
      };
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, showLanding]);

  // Fetch analytics when in Analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && !showLanding) {
      setLoadingAnalytics(true);
      fetch('http://localhost:8000/analytics/daily')
        .then(res => res.json())
        .then(data => {
          setAnalyticsData(data);
          setLoadingAnalytics(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingAnalytics(false);
        });
    }
  }, [activeTab, showLanding]);

  // Voice Alerts
  useEffect(() => {
    const currentAlert = activeTab === 'live' ? liveStats.alert : uploadStats?.alert;
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
      const res = await fetch('http://localhost:8000/analyze/image', { method: 'POST', body: formData });
      const data = await res.json();
      setImageResult(data);
    } catch (err) { console.error(err); }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append('file', videoFile);
    try {
      const res = await fetch('http://localhost:8000/upload/video', { method: 'POST', body: formData });
      const data = await res.json();
      setUploadedVideoName(data.filename);
    } catch (err) { console.error(err); }
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo" onClick={() => setShowLanding(true)} style={{ cursor: 'pointer' }}>
          AI <span>TRAFFIC</span> GUARD
        </div>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}><Clock size={16} /> Live Monitor</button>
          <button className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`} onClick={() => setActiveTab('uploads')}><Database size={16} /> Analysis Core</button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><TrendingUp size={16} /> Daily Insights</button>
          <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}><History size={16} /> Data History</button>
        </div>
        <div className="status-indicator">
          <div className="pulse"></div>
          SYSTEM OPERATIONAL
        </div>
      </header>

      <main>
        {activeTab === 'live' && (
          <div className="live-layout">
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Feed Source (id, rtsp://, file)"
                    defaultValue={liveSource}
                    onBlur={(e) => setLiveSource(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      color: '#fff', padding: '12px 20px', borderRadius: '12px', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <VideoPlayer
                sourceUrl={`ws://localhost:8000/ws/video?source=${encodeURIComponent(liveSource)}`}
                onStatsUpdate={setLiveStats}
              />

              <div className="signal-box" style={{
                borderColor: liveStats.signal_state === 'GREEN' ? 'var(--success-color)' : 'var(--danger-color)',
                color: liveStats.signal_state === 'GREEN' ? 'var(--success-color)' : 'var(--danger-color)'
              }}>
                SIGNAL: {liveStats.signal_state}
              </div>
            </div>

            <aside className="dashboard-sidebar">
              <div className="card">
                <div className="card-title">Live Density</div>
                <div className={`density-badge density-${(liveStats.density || 'low').toLowerCase()}`}>
                  {liveStats.density.toUpperCase()}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Object Tracking</div>
                <div className="metric-value">
                  {liveStats.total_vehicles}
                  <span className="metric-unit">Active Threats</span>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {Object.entries(liveStats.breakdown).map(([type, count]) => (
                    <div key={type} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{type}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-title">Active Alerts</div>
                <div style={{ minHeight: '120px' }}>
                  {liveStats.alert ? (
                    <div className="alert-message">{liveStats.alert}</div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                      Monitoring clear. No violations detected.
                    </div>
                  )}
                </div>
                <div className="toggle-wrapper" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                  <input type="checkbox" id="voice-toggle" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
                  <label htmlFor="voice-toggle" className="toggle-label">Neural Audio Synthesis (Voice Alerts)</label>
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="scrollable-tab" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Forensic Image Scan</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ flex: 1 }} />
                <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={handleImageUpload}>Process</button>
              </div>
              {imageResult && (
                <div style={{ animation: 'fadeInScale 0.4s' }}>
                  <img src={`data:image/jpeg;base64,${imageResult.image}`} style={{ width: '100%', borderRadius: '15px', border: '1px solid var(--card-border)' }} alt="Analysis" />
                  <div className="card" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Detected Objects: <strong>{imageResult.stats.total_vehicles}</strong></span>
                      <span className={`density-badge density-${imageResult.stats.density.toLowerCase()}`} style={{ padding: '2px 10px', fontSize: '0.8rem' }}>{imageResult.stats.density}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Historical Video Processing</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} style={{ flex: 1 }} />
                <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={handleVideoUpload}>Upload</button>
              </div>
              {uploadedVideoName && (
                <div style={{ animation: 'fadeInScale 0.4s' }}>
                  <VideoPlayer sourceUrl={`ws://localhost:8000/ws/video?source=${uploadedVideoName}`} onStatsUpdate={setUploadStats} />
                  {uploadStats && (
                    <div className="card" style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Real-time Density: <strong>{uploadStats.density}</strong></span>
                        <span>Count: <strong>{uploadStats.total_vehicles}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard data={analyticsData} loading={loadingAnalytics} />
        )}

        {activeTab === 'admin' && (
          <div className="card scrollable-tab" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Intelligence Archive</h3>
            <div style={{ overflowY: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>TS_ID</th>
                    <th>TIMESTAMP</th>
                    <th>DENSITY</th>
                    <th>OBJECTS</th>
                    <th>INCIDENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td><code style={{ color: 'var(--accent-secondary)' }}>{log.id.toString().padStart(4, '0')}</code></td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`density-badge density-${log.density_status?.toLowerCase() || 'low'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {log.density_status}
                        </span>
                      </td>
                      <td>{log.total_vehicles}</td>
                      <td>{log.alert_type ? <span style={{ color: 'var(--danger-color)' }}>{log.alert_type}</span> : 'CLEAR'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
