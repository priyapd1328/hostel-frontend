import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WardenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  
  // 1. Set this to your local backend for now
  const API_URL = "http://localhost:5000"; 

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/all`);
      const sorted = res.data.sort((a, b) => (a.urgency === 'High' ? -1 : 1));
      setComplaints(sorted);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    try {
      // 2. MUST match your Backend Route #5 (PUT method + /resolve path)
      await axios.put(`${API_URL}/api/complaints/${id}/resolve`);
      
      alert("Resolved successfully!");
      fetchComplaints(); // Refresh the table
    } catch (err) {
      console.error("Error resolving:", err);
      alert("Resolve failed. Check your VS Code terminal.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Warden Control Panel (AI Prioritized)</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>Title</th>
            <th>Category</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map(c => (
            <tr key={c._id} style={{ backgroundColor: c.urgency === 'High' ? '#ffdce0' : 'white' }}>
              <td>{c.title}</td>
              <td>{c.category}</td>
              <td><strong>{c.urgency}</strong></td>
              <td>{c.status}</td>
              <td>
                {c.status !== 'Resolved' ? (
                  <button 
                    onClick={() => handleResolve(c._id)}
                    style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Resolve
                  </button>
                ) : (
                  <span style={{ color: 'green' }}>✓ Fixed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WardenDashboard;