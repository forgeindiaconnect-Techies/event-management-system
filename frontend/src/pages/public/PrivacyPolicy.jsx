import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", padding: "60px 5%", color: "#334155" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", cursor: "pointer", marginBottom: "40px", padding: 0, transition: "color 0.2s" }}
          onMouseOver={(e) => e.target.style.color = "#4f46e5"}
          onMouseOut={(e) => e.target.style.color = "#64748b"}
        >
          <BsArrowLeft /> Back
        </button>

        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>Privacy Policy</h1>
        <p style={{ color: "#64748b", marginBottom: "40px" }}>Effective & Last Updated: September 11, 2026</p>

        <ol style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#475569", fontSize: "1rem" }}>
          <li style={{ marginBottom: "20px" }}>
            FIC BackRooms respects your privacy and recognizes the need to protect your personal information (any information by which you can be identified, such as name, address, email information, and telephone number) you share with us.
          </li>
          
          <li style={{ marginBottom: "20px" }}>
            We would like to assure you that we follow appropriate standards when it comes to protecting your privacy on our platforms and applications.
          </li>

          <li style={{ marginBottom: "20px" }}>
            In general, you can visit FIC BackRooms without telling us who you are or revealing any personal information about yourself. 
          </li>

          <li style={{ marginBottom: "20px" }}>
            We track the Internet address of the domains from which people visit us and analyze this data for trends and statistics, but the individual user remains anonymous unless they register.
          </li>

          <li style={{ marginBottom: "20px" }}>
            Please note that our Privacy Policy forms part of our Terms of Service available at our Terms of Service page.
          </li>

          <li style={{ marginBottom: "20px" }}>
            A transaction on FIC BackRooms is to be conducted by persons above the age of 18 years only. If you are under 18 years of age, you are not allowed to make a transaction on FIC BackRooms.
          </li>

          <li style={{ marginBottom: "20px" }}>
            It is the duty of the legal guardians of all persons below 18 years of age to ensure that their wards do not make a transaction without their supervision.
          </li>

          <li style={{ marginBottom: "20px" }}>
            It shall be automatically deemed that by allowing any person below the age of 18 years to transact on FIC BackRooms, their legal guardians have expressly consented to their actions and we disclaim any liability arising from your failure to do so.
          </li>

          <li style={{ marginBottom: "20px" }}>
            We may collect your personal data when you create an account with us or otherwise provide us with your personal data manually.
          </li>

          <li style={{ marginBottom: "20px" }}>
            We also collect data when you use any related services connected to FIC BackRooms, such as booking a movie ticket or registering for a public event.
          </li>

          <li style={{ marginBottom: "20px" }}>
            Data may be collected if you participate in contests and surveys, apply for a role, or otherwise participate in activities we promote that might require information about you.
          </li>

          <li style={{ marginBottom: "20px" }}>
            When you complete contact forms, event registrations, or request newsletters or other information from us (ex: email), that information is stored securely on our servers.
          </li>

          <li style={{ marginBottom: "20px" }}>
            When you access FIC BackRooms, we will automatically collect your computer/device data, which may include your browser type, IP address, language, and operating system.
          </li>

          <li style={{ marginBottom: "20px" }}>
            We automatically collect cookies, the ID and location of your device, and the state or country from which you accessed FIC BackRooms to optimize your experience.
          </li>

          <li style={{ marginBottom: "20px" }}>
            We monitor the pages, events, or videos you view, the length of time spent on those pages, and the manner in which you use such services (e.g., the content you access, view, click on, search for, or transact) strictly to improve platform performance.
          </li>
          
          <li style={{ marginBottom: "20px" }}>
            FIC BackRooms does not sell, rent, or lease your personal information to third parties. Data is only shared with the specific event organizer or theater manager for the event you have booked, strictly for operational purposes.
          </li>
        </ol>

        <hr style={{ margin: "40px 0", border: "0", borderTop: "1px solid #e2e8f0" }} />

        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "15px" }}>
          Customer Experience Grievance Officer Details
        </h2>
        <p style={{ color: "#475569", lineHeight: "1.8", fontSize: "1rem" }}>
          In accordance with Information Technology Act 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
        </p>
        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", marginTop: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "0 0 10px 0", color: "#334155" }}><strong>Name:</strong> Naveen Kumar</p>
          <p style={{ margin: "0 0 10px 0", color: "#334155" }}><strong>Designation:</strong> Grievance Officer</p>
          <p style={{ margin: "0 0 10px 0", color: "#334155" }}><strong>Email:</strong> grievance@ficbackrooms.com</p>
          <p style={{ margin: "0", color: "#334155" }}><strong>Working Hours:</strong> 9:00 AM to 6:00 PM (Monday to Friday)</p>
        </div>

      </div>
    </div>
  );
}
