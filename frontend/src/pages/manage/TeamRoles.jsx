import { useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarCheck,
  FaChevronRight,
  FaMicrophone,
  FaShieldAlt,
  FaUserCog,
  FaUserTie,
  FaUsers
} from "react-icons/fa";

function TeamRoles() {
  const navigate = useNavigate();
  const { id } = useParams();

  const roles = [
    {
      role: "Event Owner",
      permission: "Full event control",
      type: "Default Role",
      path: "event-owner",
      icon: <FaShieldAlt />,
      description: "Controls event ownership, publishing, deletion and high-level settings.",
      privileges: ["Publish event", "Archive event", "Manage ownership", "View all reports"]
    },
    {
      role: "Event Organizer",
      permission: "Event management",
      type: "Default Role",
      path: "event-organizer",
      icon: <FaUserTie />,
      description: "Manages event setup, team, agenda, registrations, reports and communication.",
      privileges: ["Edit event info", "Invite team", "Manage registrations", "View revenue"]
    },
    {
      role: "Event Staff",
      permission: "Event-day operations",
      type: "Default Role",
      path: "event-staff",
      icon: <FaUsers />,
      description: "Handles attendee support, check-in, ticket verification and assigned duties.",
      privileges: ["Check in attendees", "Verify tickets", "View assigned events", "Update attendance"]
    },
    {
      role: "Coordinator",
      permission: "Team coordination",
      type: "Operational Role",
      icon: <FaUserCog />,
      description: "Coordinates staff, volunteers, event-day tasks and event execution.",
      privileges: ["Assign tasks", "View team", "Track attendance", "Review event reports"]
    },
    {
      role: "Volunteer",
      permission: "Assigned tasks",
      type: "Operational Role",
      icon: <FaCalendarCheck />,
      description: "Works on assigned event tasks and updates task progress.",
      privileges: ["View tasks", "Update task status", "View assigned events", "Support event day"]
    },
    {
      role: "Speaker",
      permission: "Session access",
      type: "Program Role",
      icon: <FaMicrophone />,
      description: "Views assigned sessions, schedule and speaker participation details.",
      privileges: ["View sessions", "View schedule", "Access speaker details", "Track session assignment"]
    }
  ];

  return (
    <div className="team-roles-page">
      <div className="team-roles-header">
        <div>
          <h1>Roles & Privileges</h1>
          <p>Review what each event team role can access and manage.</p>
        </div>
      </div>

      <div className="team-tabs">
        <button type="button" onClick={() => navigate(`/events/${id}/manage/team`)}>
          Members
        </button>
        <button type="button" className="active">
          Roles & Privileges
        </button>
      </div>

      <div className="roles-summary-grid">
        <SummaryCard label="Default Roles" value="3" />
        <SummaryCard label="Operational Roles" value="2" />
        <SummaryCard label="Program Roles" value="1" />
        <SummaryCard label="Custom Roles" value="0" />
      </div>

      <section className="roles-card">
        <div className="roles-card-header">
          <div>
            <h2>Role Permissions</h2>
            <p>Default roles are connected to the current event dashboard flow.</p>
          </div>
        </div>

        <div className="roles-grid">
          {roles.map((role) => (
            <article className="role-card" key={role.role}>
              <div className="role-card-top">
                <div className="role-icon">{role.icon}</div>
                <span>{role.type}</span>
              </div>

              <h3>{role.role}</h3>
              <p>{role.description}</p>

              <div className="role-permission-line">
                <strong>Permission:</strong>
                <span>{role.permission}</span>
              </div>

              <ul>
                {role.privileges.map((privilege) => (
                  <li key={privilege}>{privilege}</li>
                ))}
              </ul>

              {role.path ? (
                <button
                  type="button"
                  className="role-view-btn"
                  onClick={() => navigate(`/events/${id}/manage/team/roles/${role.path}`)}
                >
                  View Privileges <FaChevronRight />
                </button>
              ) : (
                <button type="button" className="role-view-btn muted" disabled>
                  Privileges Preview
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <style>{teamRoleStyles}</style>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="roles-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const teamRoleStyles = `
  .team-roles-page {
    padding: 24px;
  }

  .team-roles-header {
    align-items: flex-start;
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .team-roles-header h1 {
    color: #0f172a;
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 6px;
  }

  .team-roles-header p,
  .roles-card-header p {
    color: #64748b;
    font-size: 14px;
    margin: 0;
  }

  .team-tabs {
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    gap: 18px;
    margin-bottom: 18px;
  }

  .team-tabs button {
    background: transparent;
    border: 0;
    color: #475569;
    font-size: 15px;
    padding: 0 0 12px;
  }

  .team-tabs button.active {
    border-bottom: 2px solid #4f46e5;
    color: #4f46e5;
    font-weight: 600;
  }

  .roles-summary-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 18px;
  }

  .roles-summary-card,
  .roles-card {
    background: #ffffff;
    border: 1px solid #e8ebf0;
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
  }

  .roles-summary-card {
    min-height: 88px;
    padding: 18px;
  }

  .roles-summary-card span {
    color: #64748b;
    display: block;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .roles-summary-card strong {
    color: #0f172a;
    display: block;
    font-size: 26px;
    font-weight: 700;
  }

  .roles-card {
    overflow: hidden;
  }

  .roles-card-header {
    border-bottom: 1px solid #eef1f5;
    padding: 18px 20px;
  }

  .roles-card-header h2 {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px;
  }

  .roles-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 20px;
  }

  .role-card {
    background: #f8fafc;
    border: 1px solid #edf0f4;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    min-height: 330px;
    padding: 18px;
  }

  .role-card-top {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .role-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .role-card-top span {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 9px;
  }

  .role-card h3 {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  .role-card p {
    color: #64748b;
    font-size: 13px;
    line-height: 20px;
    margin: 0 0 14px;
  }

  .role-permission-line {
    background: #ffffff;
    border: 1px solid #e8ebf0;
    border-radius: 8px;
    margin-bottom: 14px;
    padding: 10px 12px;
  }

  .role-permission-line strong,
  .role-permission-line span {
    display: block;
    font-size: 13px;
  }

  .role-permission-line strong {
    color: #64748b;
    font-weight: 500;
    margin-bottom: 3px;
  }

  .role-permission-line span {
    color: #0f172a;
    font-weight: 600;
  }

  .role-card ul {
    color: #334155;
    font-size: 13px;
    line-height: 22px;
    margin: 0 0 18px;
    padding-left: 18px;
  }

  .role-view-btn {
    align-items: center;
    background: #4f46e5;
    border: 0;
    border-radius: 6px;
    color: #ffffff;
    display: inline-flex;
    font-size: 14px;
    font-weight: 600;
    gap: 8px;
    justify-content: center;
    margin-top: auto;
    min-height: 38px;
    padding: 0 14px;
  }

  .role-view-btn.muted {
    background: #e2e8f0;
    color: #64748b;
  }

  @media (max-width: 1200px) {
    .roles-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .roles-summary-grid,
    .roles-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .team-roles-page {
      padding: 16px;
    }
  }
`;

export default TeamRoles;
