import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';

export default function TermsOfService() {
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

        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>Terms of Service</h1>
        <p style={{ color: "#64748b", marginBottom: "40px", fontStyle: "italic" }}>Last Updated: September 10, 2026</p>

        <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>
          Welcome to FIC BackRooms! These Terms of Service ("Terms") govern your use of our platform, including both our public booking interfaces and our management dashboards for theater and event operators. By accessing or using FIC BackRooms, you agree to be bound by these Terms.
        </p>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>1. Account Registration and Security</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px", lineHeight: "1.6" }}>
          <li style={{ marginBottom: "10px" }}><strong>Public Users:</strong> You must provide accurate information when booking tickets or registering for events. You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li style={{ marginBottom: "10px" }}><strong>Theater & Event Partners:</strong> Platform Admins and Theater Managers must ensure that all schedules, pricing, and availability data listed on the platform are accurate. FIC BackRooms is not liable for errors in showtimes or event details uploaded by partners.</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>2. Bookings, Payments, and Tickets</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px", lineHeight: "1.6" }}>
          <li style={{ marginBottom: "10px" }}><strong>Purchases:</strong> All ticket purchases and event registrations are subject to availability. A booking is only confirmed once payment is successfully processed and a digital ticket/confirmation is issued.</li>
          <li style={{ marginBottom: "10px" }}><strong>Pricing:</strong> Prices are set by the respective theater or event organizers. FIC BackRooms may apply a nominal convenience or service fee to bookings, which will be clearly displayed before checkout.</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>3. Cancellations and Refunds</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px", lineHeight: "1.6" }}>
          <li style={{ marginBottom: "10px" }}><strong>Customer Cancellations:</strong> Refund eligibility is determined by the specific theater or event organizer's policy. If permitted, cancellations must be made within the designated time frame prior to the show or event start time. Service fees are generally non-refundable.</li>
          <li style={{ marginBottom: "10px" }}><strong>Organizer Cancellations:</strong> If a show or event is canceled by the theater or organizer, you are entitled to a full refund of the ticket price.</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>4. Theater and Event Organizer Responsibilities</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px", lineHeight: "1.6" }}>
          <li style={{ marginBottom: "10px" }}>If you are using FIC BackRooms as a manager or operator, you agree to fulfill all accepted bookings.</li>
          <li style={{ marginBottom: "10px" }}>You must not list fraudulent events, inappropriate content, or misrepresent the amenities/screen formats (e.g., claiming a screen is IMAX when it is not).</li>
          <li style={{ marginBottom: "10px" }}>FIC BackRooms reserves the right to suspend or terminate partner accounts that repeatedly receive customer complaints or violate these terms.</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>5. Intellectual Property</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px", lineHeight: "1.6" }}>
          <li style={{ marginBottom: "10px" }}>All content, logos, platform design, and software associated with FIC BackRooms are the intellectual property of FIC BackRooms.</li>
          <li style={{ marginBottom: "10px" }}>Movie posters, trailers, and event media uploaded to the platform remain the property of their respective copyright holders and are used on this platform strictly for promotional and booking purposes.</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>6. Limitation of Liability</h3>
        <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>
          FIC BackRooms acts as an intermediary between customers and event/theater operators. We are not responsible for the actual delivery of the movie experience, venue safety, or event quality. In no event shall FIC BackRooms be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
        </p>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginTop: "30px", marginBottom: "15px" }}>7. Changes to Terms</h3>
        <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>
          We reserve the right to modify these Terms at any time. We will notify users of significant changes by updating the "Last Updated" date at the top of this page or by sending an email notification.
        </p>

        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "40px 0" }} />
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
          Disclaimer: This is a general template and should be reviewed by a legal professional to ensure it meets the specific local laws and regulations of your operating region.
        </p>
      </div>
    </div>
  );
}
