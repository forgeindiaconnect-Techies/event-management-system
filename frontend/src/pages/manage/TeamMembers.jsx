import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaEnvelope,
  FaMicrophone,
  FaPlus,
  FaShieldAlt,
  FaTasks,
  FaUserTie,
  FaUsers
} from "react-icons/fa";
import api from "../../api/axiosConfig";

function TeamMembers() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const [
          eventRes,
          staffRes,
          coordinatorRes,
          volunteerRes,
          speakerRes,
          chiefGuestRes
        ] = await Promise.allSettled([
          api.get(`/events/${id}`),
          api.get(`/staff-assignments/event/${id}`),
          api.get(`/coordinator-assignments/event/${id}`),
          api.get(`/volunteer-assignments/event/${id}`),
          api.get(`/speaker-assignments/event/${id}`),
          api.get(`/chief-guest-assignments/event/${id}`)
        ]);

        const event = eventRes.status === "fulfilled" ? eventRes.value.data : null;
        const eventMembers = [];

        if (event?.organizer) {
          eventMembers.push({
            id: `organizer-${event.organizer.id}`,
            user: event.organizer,
            role: "Event Organizer",
            responsibility: "Owns event setup and team coordination",
            active: event.organizer.active !== false
          });
        }

        eventMembers.push(
          ...mapAssignments(staffRes, "staff", "Event Staff", "duty"),
          ...mapAssignments(coordinatorRes, "coordinator", "Coordinator"),
          ...mapAssignments(volunteerRes, "volunteer", "Volunteer", "duty"),
          ...mapAssignments(speakerRes, "speaker", "Speaker", "sessionTitle"),
          ...mapAssignments(chiefGuestRes, "chiefGuest", "Chief Guest", "roleDescription")
        );

        setMembers(eventMembers);
      } catch (error) {
        setMessage("Failed to load event team members.");
      }
    }

    loadMembers();
  }, [id]);

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase();

    return members.filter((member) => {
      const name = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase();
      const email = member.user?.email?.toLowerCase() || "";
      const role = member.role.toLowerCase();

      return name.includes(query) || email.includes(query) || role.includes(query);
    });
  }, [members, search]);

  const roleCounts = members.reduce((counts, member) => {
    counts[member.role] = (counts[member.role] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1>Team</h1>
          <p>Manage event-specific members, their roles and their privileges.</p>
        </div>

        <button
          type="button"
          className="team-primary-btn"
          onClick={() => navigate("/organizer/invite-staff")}
        >
          <FaPlus /> Invite Team Members
        </button>
      </div>

      {message && <div className="team-message">{message}</div>}

      <div className="team-tabs">
        <button type="button" className="active">
          Members
        </button>
        <button type="button" onClick={() => navigate(`/events/${id}/manage/team/roles`)}>
          Roles & Privileges
        </button>
      </div>

      <div className="team-summary-grid">
        <SummaryCard icon={<FaUsers />} label="Event Members" value={members.length} />
        <SummaryCard icon={<FaShieldAlt />} label="Roles Used" value={Object.keys(roleCounts).length} />
        <SummaryCard
          icon={<FaCheckCircle />}
          label="Active Members"
          value={members.filter((member) => member.active).length}
        />
        <SummaryCard icon={<FaTasks />} label="Assignments" value={members.length} />
      </div>

      <section className="team-card">
        <div className="team-card-header">
          <div>
            <h2>Event Members</h2>
            <p>Only members assigned to this event are shown here.</p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members or roles"
          />
        </div>

        <div className="team-table-wrap">
          <table className="team-table">
            <thead>
              <tr>
                <th>Name & Email</th>
                <th>Role</th>
                <th>Responsibility</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="team-member-cell">
                      <div className="team-avatar">{getInitials(member.user)}</div>
                      <div>
                        <strong>
                          {member.user?.firstName || "Unnamed"} {member.user?.lastName || ""}
                        </strong>
                        <span>
                          <FaEnvelope /> {member.user?.email || "No email added"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={member.role} />
                  </td>
                  <td>{member.responsibility || "Event support"}</td>
                  <td>
                    <span className={member.active ? "team-status active" : "team-status inactive"}>
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="4" className="team-empty">
                    No event team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="team-card">
        <div className="team-card-header">
          <div>
            <h2>Roles & Privileges</h2>
            <p>Review what each default event role can manage.</p>
          </div>

          <button
            type="button"
            className="team-secondary-btn"
            onClick={() => navigate(`/events/${id}/manage/team/roles`)}
          >
            View All Privileges
          </button>
        </div>

        <div className="team-role-grid">
          {rolePreview.map((role) => (
            <div className="team-role-card" key={role.title}>
              <div className="team-role-icon">{role.icon}</div>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
              <strong>{roleCounts[role.title] || 0} assigned</strong>
            </div>
          ))}
        </div>
      </section>

      <style>{teamStyles}</style>
    </div>
  );
}

function mapAssignments(response, userKey, role, detailKey) {
  if (response.status !== "fulfilled") return [];

  return (response.value.data || []).map((assignment) => ({
    id: `${role}-${assignment.id}`,
    user: assignment[userKey],
    role,
    responsibility: detailKey ? assignment[detailKey] || "Event support" : "Event support",
    active: assignment.active !== false
  }));
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="team-summary-card">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  return <span className={`team-role-badge ${role.toLowerCase().replaceAll(" ", "-")}`}>{role}</span>;
}

function getInitials(user) {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  return `${first}${last}` || "TM";
}

const rolePreview = [
  {
    title: "Event Organizer",
    icon: <FaUserTie />,
    description: "Controls event setup, publishing, reports and team coordination."
  },
  {
    title: "Coordinator",
    icon: <FaShieldAlt />,
    description: "Coordinates assigned staff, volunteers, attendance and event-day tasks."
  },
  {
    title: "Event Staff",
    icon: <FaUsers />,
    description: "Handles assigned event duties, check-in and attendee support."
  },
  {
    title: "Speaker",
    icon: <FaMicrophone />,
    description: "Manages assigned sessions, schedule and speaker details."
  }
];

const teamStyles = `
  .team-page {
    padding: 24px;
  }

  .team-header {
    align-items: flex-start;
    display: flex;
    gap: 18px;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .team-header h1 {
    color: #0f172a;
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 6px;
  }

  .team-header p,
  .team-card-header p {
    color: #64748b;
    font-size: 14px;
    margin: 0;
  }

  .team-primary-btn,
  .team-secondary-btn {
    align-items: center;
    border: 0;
    border-radius: 6px;
    display: inline-flex;
    font-size: 15px;
    font-weight: 600;
    gap: 8px;
    min-height: 40px;
    padding: 0 16px;
  }

  .team-primary-btn {
    background: #4f46e5;
    color: #ffffff;
  }

  .team-secondary-btn {
    background: #eef2ff;
    color: #4338ca;
  }

  .team-message {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    color: #9a3412;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 12px 14px;
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

  .team-summary-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 18px;
  }

  .team-summary-card,
  .team-card {
    background: #ffffff;
    border: 1px solid #e8ebf0;
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
  }

  .team-summary-card {
    align-items: center;
    display: flex;
    gap: 12px;
    min-height: 92px;
    padding: 16px;
  }

  .team-summary-card > span {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .team-summary-card small {
    color: #64748b;
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .team-summary-card strong {
    color: #0f172a;
    display: block;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .team-card {
    margin-bottom: 18px;
    overflow: hidden;
  }

  .team-card-header {
    align-items: center;
    border-bottom: 1px solid #eef1f5;
    display: flex;
    gap: 16px;
    justify-content: space-between;
    padding: 18px 20px;
  }

  .team-card-header h2 {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px;
  }

  .team-card-header input {
    border: 1px solid #cfd6e3;
    border-radius: 7px;
    font-size: 14px;
    min-width: 290px;
    outline: none;
    padding: 10px 12px;
  }

  .team-card-header input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  .team-table-wrap {
    overflow-x: auto;
  }

  .team-table {
    border-collapse: collapse;
    width: 100%;
  }

  .team-table th {
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 20px;
    text-align: left;
  }

  .team-table td {
    border-top: 1px solid #eef1f5;
    color: #334155;
    font-size: 14px;
    padding: 14px 20px;
    vertical-align: middle;
  }

  .team-member-cell {
    align-items: center;
    display: flex;
    gap: 12px;
  }

  .team-avatar {
    align-items: center;
    background: #e0e7ff;
    border-radius: 50%;
    color: #4338ca;
    display: flex;
    font-size: 13px;
    font-weight: 700;
    height: 38px;
    justify-content: center;
    text-transform: uppercase;
    width: 38px;
  }

  .team-member-cell strong {
    color: #0f172a;
    display: block;
    font-size: 14px;
    font-weight: 600;
  }

  .team-member-cell span {
    align-items: center;
    color: #64748b;
    display: flex;
    font-size: 13px;
    gap: 6px;
    margin-top: 3px;
  }

  .team-role-badge,
  .team-status {
    border-radius: 999px;
    display: inline-flex;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
  }

  .team-role-badge {
    background: #eef2ff;
    color: #4338ca;
  }

  .team-role-badge.volunteer {
    background: #ecfdf5;
    color: #047857;
  }

  .team-role-badge.speaker {
    background: #fef3c7;
    color: #92400e;
  }

  .team-role-badge.chief-guest {
    background: #fce7f3;
    color: #be185d;
  }

  .team-status.active {
    background: #dcfce7;
    color: #166534;
  }

  .team-status.inactive {
    background: #f1f5f9;
    color: #64748b;
  }

  .team-empty {
    color: #64748b !important;
    padding: 32px !important;
    text-align: center;
  }

  .team-role-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 20px;
  }

  .team-role-card {
    background: #f8fafc;
    border: 1px solid #edf0f4;
    border-radius: 8px;
    min-height: 190px;
    padding: 16px;
  }

  .team-role-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 40px;
    justify-content: center;
    margin-bottom: 14px;
    width: 40px;
  }

  .team-role-card h3 {
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  .team-role-card p {
    color: #64748b;
    font-size: 13px;
    line-height: 20px;
    margin: 0 0 14px;
  }

  .team-role-card strong {
    color: #4f46e5;
    font-size: 13px;
    font-weight: 600;
  }

  @media (max-width: 1100px) {
    .team-summary-grid,
    .team-role-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .team-page {
      padding: 16px;
    }

    .team-header,
    .team-card-header {
      align-items: stretch;
      flex-direction: column;
    }

    .team-card-header input,
    .team-primary-btn,
    .team-secondary-btn {
      width: 100%;
    }

    .team-summary-grid,
    .team-role-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default TeamMembers;
