import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const App = () => {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [view, setView] = useState('student');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [myHistory, setMyHistory] = useState([]); // FEATURE: Student History State
  const [stats, setStats] = useState([]);

  // Socket Listener for Real-time alerts
  useEffect(() => {
    socket.on("connect", () => console.log("Socket Connected"));
    socket.on("new_complaint", (data) => {
      if (user?.role === 'staff') {
        toast.info(`🚀 New Issue: ${data.title}`);
        fetchAll();
      }
    });
    // Listen for status updates to refresh history in real-time
    socket.on("status_updated", (data) => {
      if (user?.role === 'student') {
        fetchMyHistory(user.id);
      }
    });
    return () => {
      socket.off("new_complaint");
      socket.off("status_updated");
    };
  }, [user]);

  // FEATURE: Fetch specific student history
  const fetchMyHistory = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/complaints/user/${userId}`);
      setMyHistory(res.data);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  // Authentication Logic
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:5000${url}`, formData);
      
      const serverUser = res.data.user;
      
      const loggedInUser = { 
        email: formData.email, 
        role: serverUser?.role || formData.role, 
        id: serverUser?.id || serverUser?._id || "657f12345678901234567890" 
      };
      
      setUser(loggedInUser);

      // Auto-Routing & Data Fetching
      if (loggedInUser.role === 'staff') {
        setView('warden');
        fetchAll();
      } else {
        setView('student');
        fetchMyHistory(loggedInUser.id); // Load history on login
      }

      toast.success(`Access Granted: ${loggedInUser.role} Portal`);
    } catch (err) { 
      console.error(err);
      toast.error(err.response?.data?.message || "Authentication Failed"); 
    }
  };

  const fetchAll = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints/all');
      setAllComplaints(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints/stats');
      setStats(res.data.length > 0 ? res.data : [
        { _id: 'Electrical', count: 5 },
        { _id: 'Plumbing', count: 3 },
        { _id: 'Cleaning', count: 2 }
      ]);
    } catch (err) { console.error(err); }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/complaints/${id}/resolve`);
      toast.success("Issue Resolved!");
      fetchAll(); 
    } catch (err) { toast.error("Failed to resolve"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/complaints/add', { 
        title, description, createdBy: user.id 
      });
      setPrediction(res.data.complaint);
      setTitle(''); 
      setDescription('');
      toast.success("AI Analysis Complete & Transmitted");
      fetchMyHistory(user.id); // Refresh history after new post
    } catch (err) { toast.error("Submission Failed"); }
  };

  const styles = {
    loginWrapper: { 
      height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', 
      backgroundColor: '#0a0a0c',
      backgroundImage: `radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)`
    },
    glassCard: { 
      background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)', padding: '50px', borderRadius: '32px', width: '400px', textAlign: 'center'
    },
    sidebar: { 
      width: '280px', background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)',
      padding: '30px', display: 'flex', flexDirection: 'column', color: '#f8fafc' 
    },
    input: { 
      width: '100%', padding: '15px', margin: '12px 0', borderRadius: '12px', 
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
      color: 'white', fontSize: '15px', outline: 'none'
    },
    actionBtn: {
      width: '100%', padding: '15px', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
      color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
    },
    badge: (urgency) => ({
      padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
      background: urgency === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 165, 233, 0.1)',
      color: urgency === 'High' ? '#f87171' : '#38bdf8',
      border: `1px solid ${urgency === 'High' ? '#ef4444' : '#0ea5e9'}`
    })
  };

  // --- LOGIN VIEW ---
  if (!user) {
    return (
      <div style={styles.loginWrapper}>
        <div style={styles.glassCard}>
          <div style={{ background: 'linear-gradient(to bottom right, #4f46e5, #ec4899)', width: '60px', height: '60px', borderRadius: '18px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🛰️</div>
          <h2 style={{ color: 'white', fontSize: '32px', margin: 0, fontWeight: '800' }}>Hostel<span style={{color: '#818cf8'}}>AI</span></h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '14px' }}>Nexus Management System</p>
          
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <input style={styles.input} placeholder="Display Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            )}
            <input style={styles.input} type="email" placeholder="Institutional Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input style={styles.input} type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            
            <select style={{...styles.input, color: '#94a3b8'}} value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="student">Identity: Student</option>
                <option value="staff">Identity: Warden</option>
            </select>

            <button type="submit" style={styles.actionBtn}>
              {authMode === 'login' ? 'Authenticate' : 'Initialize Account'}
            </button>
          </form>
          
          <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ color: '#6366f1', cursor: 'pointer', marginTop: '25px', fontSize: '13px' }}>
            {authMode === 'login' ? "Access Request →" : "Return to Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <ToastContainer theme="dark" />
      
      <div style={styles.sidebar}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '40px' }}>🛰️ Hostel<span style={{color: '#6366f1'}}>AI</span></h2>
        
        {user.role === 'student' && (
          <button style={{...styles.input, background: view === 'student' ? '#1e293b' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer'}} onClick={() => setView('student')}>📝 New Log</button>
        )}

        {user.role === 'staff' && (
          <>
            <button style={{...styles.input, background: view === 'warden' ? '#1e293b' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer'}} onClick={() => { setView('warden'); fetchAll(); }}>📋 Command Center</button>
            <button style={{...styles.input, background: view === 'stats' ? '#1e293b' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer'}} onClick={() => { setView('stats'); fetchStats(); }}>📊 Analytics</button>
          </>
        )}
        
        <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '12px' }}>
          <p style={{ color: '#64748b' }}>Operator: <b>{user.role}</b></p>
          <p style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          <p style={{ color: '#ef4444', cursor: 'pointer', marginTop: '10px' }} onClick={() => setUser(null)}>Disconnect</p>
        </div>
      </div>

      <main style={{ flex: 1, padding: '50px', color: 'white' }}>
        
        {/* STUDENT ONLY */}
        {view === 'student' && user.role === 'student' && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Issue Registration</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleSubmit}>
                <input style={styles.input} placeholder="Subject Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <textarea style={{ ...styles.input, height: '150px' }} placeholder="Provide specific details for the AI engine..." value={description} onChange={(e) => setDescription(e.target.value)} required />
                <button type="submit" style={styles.actionBtn}>Analyze & Transmit</button>
              </form>
              {prediction && (
                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', border: '1px solid #6366f1' }}>
                  <p style={{ margin: 0 }}>🤖 <b>AI Intel:</b> {prediction.category} | Priority: <span style={styles.badge(prediction.urgency)}>{prediction.urgency}</span></p>
                </div>
              )}
            </div>

            {/* STUDENT HISTORY TABLE */}
            
            <div style={{ marginTop: '50px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#818cf8' }}>Personal Log History</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: '12px' }}>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '15px' }}>TITLE</th>
                      <th>CATEGORY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myHistory.length > 0 ? myHistory.map(log => (
                      <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '15px', fontSize: '14px', fontWeight: '500' }}>{log.title}</td>
                        <td style={{ fontSize: '13px', color: '#94a3b8' }}>{log.category}</td>
                        <td style={{ fontSize: '13px' }}>
                          <span style={{ 
                            color: log.status === 'Resolved' ? '#10b981' : '#f59e0b',
                            background: log.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${log.status === 'Resolved' ? '#10b981' : '#f59e0b'}`
                          }}>
                            {log.status === 'Resolved' ? 'Completed' : 'Processing'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No logs dispatched yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* WARDEN ONLY: Table */}
        {view === 'warden' && user.role === 'staff' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '30px' }}>Command Center</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                    <th style={{ padding: '20px' }}>IDENTIFIER</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {allComplaints.map(c => (
                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '20px', fontWeight: 'bold' }}>{c.title}</td>
                      <td><span style={styles.badge(c.urgency)}>{c.urgency}</span></td>
                      <td style={{ color: c.status === 'Resolved' ? '#10b981' : '#f59e0b' }}>{c.status}</td>
                      <td>
                        {c.status !== 'Resolved' ? (
                          <button onClick={() => handleResolve(c._id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Resolve</button>
                        ) : (
                          <span style={{color: '#10b981', fontSize: '13px'}}>✓ Fixed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WARDEN ONLY: Stats */}
        {view === 'stats' && user.role === 'staff' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>System Intelligence</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '400px' }}>
                <Pie 
                  data={{
                    labels: stats.map(s => s._id),
                    datasets: [{ 
                      data: stats.map(s => s.count), 
                      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'],
                      borderColor: 'rgba(255,255,255,0.1)', borderWidth: 2
                    }]
                  }} 
                  options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;