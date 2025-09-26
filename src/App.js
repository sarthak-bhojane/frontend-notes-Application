// App.js
import React, { useState, useEffect } from "react";
import "./App.css";


// const API_URL = "http://localhost:5000";
const API_URL = "https://backend-notes-application-lq2e.onrender.com";


export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
      fetchNotes();
    }
  }, [token]);

  async function login(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Network error");
    }
  }

  async function fetchNotes() {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setToken("");
        localStorage.removeItem("token");
        return;
      }
      const data = await res.json();
      setNotes(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function addNote() {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.status === 403) {
        const body = await res.json();
        alert(body.message || "Free plan limit reached");
        fetchNotes(); // refresh
        return;
      }
      const note = await res.json();
      setNotes([...notes, note]);
      setContent("");
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNote(id) {
    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function upgrade() {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const slug = payload.tenant;
    const res = await fetch(`${API_URL}/tenants/${slug}/upgrade`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("Upgraded to Pro!");
      fetchNotes();
    } else {
      const body = await res.json();
      alert(body.message || "Upgrade failed");
    }
  }

  if (!token)
    return (
      <form onSubmit={login}  className="login-form" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h2>Login for Multi-tenant SaaS Notes Application </h2>
        <input name="email" placeholder="Email" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <input name="password" type="password" placeholder="Password" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <button style={{ padding: 8 }}>Login</button>
        <p>Test accounts: admin@acme.test / user@acme.test / admin@globex.test / user@globex.test (password: password)</p>
      </form>
    );

  return (
    <div className="notes-container" style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Notes</h2>
      <div className="notes-input-group" style={{ display: "flex", gap: 8 }}>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="New note" style={{ flex: 1, padding: 8 }} />
        <button className="add-btn" onClick={addNote} style={{ padding: "8px 12px" }}>Add</button>
        {userRole === "admin" && <button onClick={upgrade} style={{ padding: "8px 12px", background: "#f39c12" }}>Upgrade to Pro</button>}
      </div>
      <ul  className="notes-list" style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
        {notes.map((n) => (
          <li key={n.id} style={{ display: "flex", justifyContent: "space-between", padding: 10, border: "1px solid #ddd", marginBottom: 6 }}>
            <span>{n.content}</span>
            <button className="add-btn" onClick={() => deleteNote(n.id)} style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "6px 10px" }}>Delete</button>
          </li>
        ))}
      </ul>
      <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); setToken(""); }} style={{ marginTop: 12 }}>Logout</button>
    </div>
  );
}
