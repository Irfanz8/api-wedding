// Frontend Integration Example
// Use this as a reference for building your wedding invitation website/app

import QRCode from "qrcode";

const API_BASE_URL = "http://localhost:8787"; // Change to production URL

// ============================================================================
// Authentication Functions
// ============================================================================

export async function register(email: string, password: string, name: string) {
const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password, name }),
});

if (!response.ok) {
const error = await response.json();
throw new Error(error.error || "Registration failed");
}

const data = await response.json();
localStorage.setItem("token", data.token);
return data;
}

export async function login(email: string, password: string) {
const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password }),
});

if (!response.ok) {
throw new Error("Login failed");
}

const data = await response.json();
localStorage.setItem("token", data.token);
return data;
}

export function logout() {
localStorage.removeItem("token");
}

export function getToken() {
return localStorage.getItem("token");
}

function getAuthHeaders() {
const token = getToken();
return {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
};
}

export async function getCurrentUser() {
const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
headers: getAuthHeaders(),
});

if (!response.ok) {
throw new Error("Failed to fetch user");
}

return response.json();
}

// ============================================================================
// Invitation Functions
// ============================================================================

export interface CreateInvitationData {
groom_name: string;
bride_name: string;
ceremony_date: string;
ceremony_time: string;
location: string;
description?: string;
max_guests?: number;
}

export async function createInvitation(data: CreateInvitationData) {
const response = await fetch(`${API_BASE_URL}/api/invitations`, {
method: "POST",
headers: getAuthHeaders(),
body: JSON.stringify(data),
});

if (!response.ok) {
throw new Error("Failed to create invitation");
}

return response.json();
}

export async function getInvitationByCode(code: string) {
const response = await fetch(`${API_BASE_URL}/api/invitations/${code}`);

if (!response.ok) {
throw new Error("Invitation not found");
}

return response.json();
}

export async function listInvitations() {
const response = await fetch(`${API_BASE_URL}/api/invitations`, {
headers: getAuthHeaders(),
});

if (!response.ok) {
throw new Error("Failed to fetch invitations");
}

return response.json();
}

export async function updateInvitation(id: string, data: Partial<CreateInvitationData>) {
const response = await fetch(`${API_BASE_URL}/api/invitations/${id}`, {
method: "PUT",
headers: getAuthHeaders(),
body: JSON.stringify(data),
});

if (!response.ok) {
throw new Error("Failed to update invitation");
}

return response.json();
}

export async function deleteInvitation(id: string) {
const response = await fetch(`${API_BASE_URL}/api/invitations/${id}`, {
method: "DELETE",
headers: getAuthHeaders(),
});

if (!response.ok) {
throw new Error("Failed to delete invitation");
}

return response.json();
}

// ============================================================================
// Confirmation Functions
// ============================================================================

export interface ConfirmAttendanceData {
invitation_code: string;
guest_name: string;
guest_email: string;
phone?: string;
plus_one?: boolean;
dietary_restrictions?: string;
confirmed: boolean;
}

export async function confirmAttendance(data: ConfirmAttendanceData) {
const response = await fetch(`${API_BASE_URL}/api/confirmations/confirm`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(data),
});

if (!response.ok) {
const error = await response.json();
throw new Error(error.error || "Failed to confirm attendance");
}

return response.json();
}

export async function getConfirmationByCode(code: string) {
const response = await fetch(
`${API_BASE_URL}/api/confirmations/${code}`
);

if (!response.ok) {
throw new Error("Confirmation not found");
}

return response.json();
}

export async function getConfirmations(invitationId: string) {
const response = await fetch(
`${API_BASE_URL}/api/confirmations/invitations/${invitationId}`,
{
headers: getAuthHeaders(),
}
);

if (!response.ok) {
throw new Error("Failed to fetch confirmations");
}

return response.json();
}

// ============================================================================
// QR Code Handling
// ============================================================================

export async function displayQRCode(qrDataUrl: string, containerId: string) {
const container = document.getElementById(containerId);
if (!container) {
throw new Error(`Container ${containerId} not found`);
}

const img = document.createElement("img");
img.src = qrDataUrl;
img.alt = "Confirmation QR Code";
img.style.maxWidth = "300px";

// Clear previous content
container.innerHTML = "";
container.appendChild(img);
}

export async function downloadQRCode(qrDataUrl: string, filename: string) {
const link = document.createElement("a");
link.href = qrDataUrl;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

// ============================================================================
// React Component Examples
// ============================================================================

/\*\*

- Example React Component: Invitation Card
  \*/
  export function InvitationCard({
  invitation,
  onCopy,
  }: {
  invitation: any;
  onCopy?: (code: string) => void;
  }) {
  return (
  <div className="invitation-card">
  <h2>
  {invitation.groom_name} & {invitation.bride_name}
  </h2>
  <p className="date">{invitation.ceremony_date}</p>
  <p className="time">{invitation.ceremony_time}</p>
  <p className="location">{invitation.location}</p>
  {invitation.description && <p className="description">{invitation.description}</p>}

        <div className="invitation-code">
          <span>Code: {invitation.invitation_code}</span>
          <button onClick={() => onCopy?.(invitation.invitation_code)}>
            Copy
          </button>
        </div>
      </div>

  );
  }

/\*\*

- Example React Component: Guest Confirmation Form
  \*/
  export function ConfirmationForm({
  invitationCode,
  onSubmit,
  }: {
  invitationCode: string;
  onSubmit?: (data: ConfirmAttendanceData) => void;
  }) {
  const [formData, setFormData] = React.useState({
  invitation_code: invitationCode,
  guest_name: "",
  guest_email: "",
  phone: "",
  plus_one: false,
  dietary_restrictions: "",
  confirmed: true,
  });

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

    try {
      const result = await confirmAttendance(formData);
      console.log("Confirmed:", result);

      // Display QR code
      if (result.confirmation.qr_code) {
        displayQRCode(
          result.confirmation.qr_code,
          "qr-container"
        );
      }

      onSubmit?.(formData);
    } catch (error) {
      console.error("Confirmation failed:", error);
      alert("Failed to confirm attendance");
    }

};

return (
<form onSubmit={handleSubmit} className="confirmation-form">
<input
type="text"
placeholder="Your Name"
value={formData.guest_name}
onChange={(e) =>
setFormData({ ...formData, guest_name: e.target.value })
}
required
/>

      <input
        type="email"
        placeholder="Your Email"
        value={formData.guest_email}
        onChange={(e) =>
          setFormData({ ...formData, guest_email: e.target.value })
        }
        required
      />

      <input
        type="tel"
        placeholder="Phone (optional)"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />

      <label>
        <input
          type="checkbox"
          checked={formData.plus_one}
          onChange={(e) =>
            setFormData({ ...formData, plus_one: e.target.checked })
          }
        />
        I will bring a plus one
      </label>

      <textarea
        placeholder="Dietary Restrictions (optional)"
        value={formData.dietary_restrictions}
        onChange={(e) =>
          setFormData({ ...formData, dietary_restrictions: e.target.value })
        }
      />

      <label>
        <input
          type="checkbox"
          checked={formData.confirmed}
          onChange={(e) =>
            setFormData({ ...formData, confirmed: e.target.checked })
          }
        />
        I confirm my attendance
      </label>

      <button type="submit">Confirm Attendance</button>

      <div id="qr-container" style={{ marginTop: "20px" }}></div>
    </form>

);
}

/\*\*

- Example React Component: Admin Dashboard
  \*/
  export function AdminDashboard() {
  const [invitations, setInvitations] = React.useState([]);
  const [selectedInvitation, setSelectedInvitation] = React.useState(null);
  const [confirmations, setConfirmations] = React.useState([]);
  const [stats, setStats] = React.useState(null);

React.useEffect(() => {
loadInvitations();
}, []);

const loadInvitations = async () => {
try {
const result = await listInvitations();
setInvitations(result.invitations);
} catch (error) {
console.error("Failed to load invitations:", error);
}
};

const selectInvitation = async (invId: string) => {
setSelectedInvitation(invId);

    try {
      const result = await getConfirmations(invId);
      setConfirmations(result.confirmations);
      setStats(result.stats);
    } catch (error) {
      console.error("Failed to load confirmations:", error);
    }

};

return (
<div className="admin-dashboard">
<h1>Wedding Invitations Admin</h1>

      <div className="invitations-list">
        <h2>Your Invitations</h2>
        {invitations.map((inv: any) => (
          <div
            key={inv.id}
            className="invitation-item"
            onClick={() => selectInvitation(inv.id)}
          >
            <h3>{inv.invitation_code}</h3>
            <p>
              {inv.groom_name} & {inv.bride_name}
            </p>
            <p>{inv.ceremony_date}</p>
          </div>
        ))}
      </div>

      {selectedInvitation && stats && (
        <div className="confirmations-section">
          <h2>Confirmations</h2>

          <div className="stats">
            <div className="stat">
              <span className="label">Total</span>
              <span className="value">{stats.total}</span>
            </div>
            <div className="stat">
              <span className="label">Confirmed</span>
              <span className="value" style={{ color: "green" }}>
                {stats.confirmed}
              </span>
            </div>
            <div className="stat">
              <span className="label">Pending</span>
              <span className="value" style={{ color: "orange" }}>
                {stats.pending}
              </span>
            </div>
            <div className="stat">
              <span className="label">Plus Ones</span>
              <span className="value">{stats.with_plus_one}</span>
            </div>
          </div>

          <div className="confirmations-table">
            <table>
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Plus One</th>
                  <th>Dietary</th>
                </tr>
              </thead>
              <tbody>
                {confirmations.map((conf: any) => (
                  <tr key={conf.id}>
                    <td>{conf.guest_name}</td>
                    <td>{conf.guest_email}</td>
                    <td>{conf.confirmed ? "✓ Confirmed" : "Pending"}</td>
                    <td>{conf.plus_one ? "Yes" : "No"}</td>
                    <td>{conf.dietary_restrictions || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatDate(dateString: string): string {
return new Date(dateString).toLocaleDateString("en-US", {
year: "numeric",
month: "long",
day: "numeric",
});
}

export function formatTime(timeString: string): string {
const [hour, minute] = timeString.split(":");
const h = parseInt(hour);
const ampm = h >= 12 ? "PM" : "AM";
const displayHour = h % 12 || 12;
return `${displayHour}:${minute} ${ampm}`;
}

export function copyToClipboard(text: string) {
navigator.clipboard.writeText(text);
}

export async function shareQRCode(qrDataUrl: string) {
if (navigator.share) {
const blob = await (await fetch(qrDataUrl)).blob();
const file = new File([blob], "invitation-qr.png", { type: "image/png" });

    try {
      await navigator.share({
        title: "Wedding Invitation",
        text: "Here is my wedding invitation QR code",
        files: [file],
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }

}
}

// ============================================================================
// Example Usage
// ============================================================================

/\*
// In your app.tsx or main component:

import React from 'react';
import {
register,
login,
createInvitation,
confirmAttendance,
getInvitationByCode,
AdminDashboard,
ConfirmationForm,
} from './api-client';

export default function App() {
const [user, setUser] = React.useState(null);
const [page, setPage] = React.useState('login'); // 'login', 'dashboard', 'confirm'

return (
<div>
{!user ? (
<LoginPage onLogin={(u) => setUser(u)} />
) : page === 'dashboard' ? (
<AdminDashboard />
) : (
<ConfirmationPage />
)}
</div>
);
}
\*/
