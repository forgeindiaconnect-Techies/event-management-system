  import { useCallback, useEffect, useState } from "react";
  import { useNavigate, useParams, Link } from "react-router-dom";
  import api from "../../api/axiosConfig";
  import { getDefaultBanner } from "../../utils/bannerUtils";
  import logo from "../../assets/images/fic-logo.png";
  import UserProfileMenu from "../../components/Public/UserProfileMenu";
  import {
    BsArrowLeft,
    BsCalendarEvent,
    BsGeoAlt,
    BsPerson,
    BsEnvelope,
    BsPhone,
    BsArrowRight,
  } from "react-icons/bs";

  const formFieldCache = new Map();
  const formFieldRequests = new Map();
  const reservedTicketFieldLabels = new Set([
    "ticket count",
    "ticket quantity",
    "number of tickets",
    "tickets"
  ]);

  function PublicRegistrationForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [formFields, setFormFields] = useState([]);
    const [ticketClasses, setTicketClasses] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedTicketClassId, setSelectedTicketClassId] = useState("");
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [qrGenerationMode, setQrGenerationMode] = useState("PER_TICKET");

    const [participant, setParticipant] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      registrationType: "PARTICIPANT",
    });
    const selectedTicketClass = ticketClasses.find(
      (ticketClass) => String(ticketClass.id) === String(selectedTicketClassId)
    );

    const loadEvent = useCallback(async () => {
      try {
        const [eventRes, classesRes] = await Promise.allSettled([
          api.get(`/events/public/${id}`),
          api.get(`/ticket-classes/event/${id}`)
        ]);

        if (eventRes.status === "fulfilled") {
          setEvent(eventRes.value.data);
        }

        if (classesRes.status === "fulfilled") {
          const classes = Array.isArray(classesRes.value.data) ? classesRes.value.data : [];
          setTicketClasses(
            classes
              .filter((item) => item.active !== false && item.saleStatus === "Active")
              .map(normalizeTicketClass)
          );
        }
      } catch (error) {
        console.log(error);
        setMessage("Unable to load event.");
      }
    }, [id]);

    const loadFormFields = useCallback(async () => {
      const fieldKey = `${id}-${participant.registrationType}`;

      if (formFieldCache.has(fieldKey)) {
        setFormFields(sanitizeFormFields(formFieldCache.get(fieldKey)));
        return;
      }

      if (formFieldRequests.has(fieldKey)) {
        const cachedFields = await formFieldRequests.get(fieldKey);
        setFormFields(sanitizeFormFields(cachedFields));
        return;
      }

      try {
        const request = api.get(
          `/form-fields/event/${id}/type/${participant.registrationType}`
        ).then((res) => sanitizeFormFields(res.data || []));

        formFieldRequests.set(fieldKey, request);

        const fields = await request;
        formFieldCache.set(fieldKey, fields);
        setFormFields(fields);
      } catch (error) {
        console.log(error);
        setFormFields([]);
      } finally {
        formFieldRequests.delete(fieldKey);
      }
    }, [id, participant.registrationType]);

    useEffect(() => {
      loadEvent();
    }, [loadEvent]);

    useEffect(() => {
      loadFormFields();
    }, [loadFormFields]);

    useEffect(() => {
      if (participant.registrationType !== "AUDIENCE") {
        setSelectedTicketClassId("");
        setTicketQuantity(1);
        return;
      }

      const selectedClass = ticketClasses.find(
        (ticketClass) => String(ticketClass.id) === String(selectedTicketClassId)
      );
      const availableClass =
        selectedClass && getAvailableSeats(selectedClass) > 0
          ? selectedClass
          : ticketClasses.find((ticketClass) => getAvailableSeats(ticketClass) > 0);

      if (availableClass && String(availableClass.id) !== String(selectedTicketClassId)) {
        setSelectedTicketClassId(String(availableClass.id));
        setTicketQuantity(1);
      }
    }, [participant.registrationType, selectedTicketClassId, ticketClasses]);

    useEffect(() => {
      if (!selectedTicketClass) {
        return;
      }

      const maxQuantity = getMaxSelectableQuantity(selectedTicketClass);
      if (Number(ticketQuantity) > maxQuantity) {
        setTicketQuantity(maxQuantity);
      }
    }, [selectedTicketClass, ticketQuantity]);

    const handleParticipantChange = (e) => {
      setParticipant({
        ...participant,
        [e.target.name]: e.target.value,
      });
    };

    const handleAnswerChange = (fieldId, value) => {
      setAnswers({
        ...answers,
        [fieldId]: value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage("");

      try {
        setLoading(true);

        const payload = {
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    phoneNumber: participant.phoneNumber,
    registrationType: participant.registrationType,
    ticketClassId: selectedTicketClassId ? Number(selectedTicketClassId) : null,
    ticketQuantity: participant.registrationType === "AUDIENCE" ? Number(ticketQuantity || 1) : 1,
    qrGenerationMode: participant.registrationType === "AUDIENCE" ? qrGenerationMode : "PER_PARTICIPANT",
    answers: formFields.map((field) => ({
      fieldId: field.id,
      answer: answers[field.id] || "",
    })),
  };

        const res = await api.post(
    `/registrations/public/event/${id}`,
    payload
  );

        const registrationId = res.data.id;

        if (payableAmount > 0) {
          navigate(`/public/events/${id}/payment/${registrationId}`);
        } else {
          console.log(res.data);

  navigate(`/public/ticket/${res.data.id}`);
        }
      } catch (error) {
        console.log(error);
        setMessage(
          error.response?.data?.message ||
            "Unable to submit registration. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!event) {
      return <div className="container py-5">Loading registration form...</div>;
    }

    const banner = event.bannerUrl || getDefaultBanner(event.eventType);
    const maxPerBuyer = selectedTicketClass ? getMaxSelectableQuantity(selectedTicketClass) : 1;
  const payableAmount =
    participant.registrationType === "AUDIENCE" && selectedTicketClass
      ? Number(selectedTicketClass.price || 0) * Number(ticketQuantity || 1)
      : event.paid
      ? Number(event.ticketPrice || 0)
      : 0;

    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <nav
          className="public-flow-navbar d-flex justify-content-between align-items-center px-5"
          style={{ height: "68px", background: "#030712", color: "#fff" }}
        >
          <Link
            to="/"
            className="d-flex align-items-center gap-3 text-white text-decoration-none"
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#fff",
                overflow: "hidden",
                padding: "4px",
              }}
            >
              <img
                src={logo}
                alt="FIC BackRooms"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <strong style={{ fontSize: "22px" }}>FIC BackRooms</strong>
          </Link>

          <div className="public-flow-navbar-actions d-flex align-items-center gap-4">
            <Link to="/find-events" className="public-nav-link text-white text-decoration-none">
              Find Events
            </Link>
            <UserProfileMenu dark />
          </div>
        </nav>

        <section className="public-registration-hero"
          style={{
            minHeight: "250px",
            background: `linear-gradient(90deg, rgba(3,7,18,.92), rgba(88,28,135,.55)), url(${banner}) center/cover`,
            color: "#fff",
          }}
        >
          <div className="container py-5">
            <button
              className="btn btn-light mb-4"
              onClick={() => navigate(`/public/events/${id}`)}
            >
              <BsArrowLeft className="me-2" />
              Back to Event
            </button>

            <h1 className="fw-bold mb-2" style={{ fontSize: "38px" }}>
              Register for {event.eventName}
            </h1>

            <p className="mb-0" style={{ color: "#e5e7eb" }}>
              Complete your details and answer the organizer's registration form.
            </p>
          </div>
        </section>

        <main className="public-flow-main container py-4">
          <div className="row g-4">
            <div className="col-lg-8">
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                    <div>
                      <h4 className="fw-bold mb-2">Registration Form</h4>
                      <p className="text-muted mb-0">
                        Complete the required details and the fields configured by the organizer.
                      </p>
                    </div>

                    <div style={{ width: "240px", maxWidth: "100%" }}>
                      <label className="form-label fw-semibold">Registration Type</label>
                      <select
                        className="form-select"
                        name="registrationType"
                        value={participant.registrationType}
                        onChange={handleParticipantChange}
                      >
                        <option value="PARTICIPANT">Participant</option>
                        <option value="AUDIENCE">Audience</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <BsPerson />
                        </span>
                        <input
                          className="form-control"
                          name="firstName"
                          placeholder="Enter first name"
                          value={participant.firstName}
                          onChange={handleParticipantChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last Name <span className="text-danger">*</span></label>
                      <input
                        className="form-control"
                        name="lastName"
                        placeholder="Enter last name"
                        value={participant.lastName}
                        onChange={handleParticipantChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <BsEnvelope />
                        </span>
                        <input
                          className="form-control"
                          type="email"
                          name="email"
                          placeholder="Enter email address"
                          value={participant.email}
                          onChange={handleParticipantChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <BsPhone />
                        </span>
                        <input
                          className="form-control"
                          name="phoneNumber"
                          placeholder="Enter phone number"
                          value={participant.phoneNumber}
                          onChange={handleParticipantChange}
                          required
                        />
                      </div>
                    </div>

                    {formFields.map((field) => (
                      <div className="col-md-6" key={field.id}>
                        <label className="form-label fw-semibold">
                          {field.label || field.fieldLabel}
                          {field.required && <span className="text-danger ms-1">*</span>}
                        </label>
                        {renderDynamicField(field, answers, handleAnswerChange)}
                      </div>
                    ))}
                  </div>
                </div>

                {participant.registrationType === "AUDIENCE" && ticketClasses.length > 0 && (
                  <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
                    <h4 className="fw-bold mb-3">Ticket Class</h4>

                    <div className="row g-3">
                      {ticketClasses.map((ticketClass) => {
                        const seats = Number(ticketClass.seats || 0);
                        const sold = Number(ticketClass.sold || 0);
                        const available = getAvailableSeats(ticketClass);
                        const selected = String(selectedTicketClassId) === String(ticketClass.id);

                        return (
                          <div className="col-md-6" key={ticketClass.id}>
                            <button
                              type="button"
                              className="w-100 text-start border p-3 bg-white"
                              style={{
                                borderRadius: "14px",
                                borderColor: selected ? "#4f46e5" : "#e5e7eb",
                                boxShadow: selected ? "0 10px 24px rgba(79,70,229,.12)" : "none"
                              }}
                              onClick={() => {
                                setSelectedTicketClassId(String(ticketClass.id));
                                setTicketQuantity(1);
                              }}
                              disabled={available <= 0 || ticketClass.saleStatus === "Sold Out"}
                            >
                              <div className="d-flex justify-content-between gap-3">
                                <div>
                                  <div className="fw-bold">{ticketClass.name}</div>
                                  <small className="text-muted">{ticketClass.description || "Event access pass"}</small>
                                </div>
                                <div className="fw-bold text-primary">
                                  Rs. {Number(ticketClass.price || 0).toLocaleString("en-IN")}
                                </div>
                              </div>
                              <div className="text-muted small mt-2">
                                {available} available
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Quantity</label>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          max={maxPerBuyer}
                          value={ticketQuantity}
                          onChange={(e) => {
                            const nextQuantity = Math.min(
                              Math.max(Number(e.target.value || 1), 1),
                              maxPerBuyer
                            );
                            setTicketQuantity(nextQuantity);
                          }}
                        />
                        <small className="text-muted">Maximum {maxPerBuyer} per booking</small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">QR Type</label>
                        <select
                          className="form-select"
                          value={qrGenerationMode}
                          onChange={(e) => setQrGenerationMode(e.target.value)}
                        >
                          <option value="PER_TICKET">One QR per ticket</option>
                          <option value="PER_ORDER">One QR for full order</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {message && <div className="alert alert-danger">{message}</div>}

                <button
                  className="btn btn-primary px-4"
                  disabled={loading}
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  {loading
                    ? "Submitting..."
                    : payableAmount > 0
                    ? "Continue to Payment"
                    : "Submit Registration"}{" "}
                  <BsArrowRight className="ms-2" />
                </button>
              </form>
            </div>

            <div className="col-lg-4">
              <div className="public-flow-summary bg-white rounded-4 shadow-sm p-4 sticky-top">
                <h4 className="fw-bold mb-3">Event Summary</h4>

                <p>
                  <BsCalendarEvent className="me-2 text-primary" />
                  {formatDate(event.startDateTime)}
                </p>

                <p>
                  <BsGeoAlt className="me-2 text-danger" />
                  {event.venue || "Online"}
                </p>

                <hr />

                <p className="text-muted mb-1">Registration Fee</p>
                <h3 className="fw-bold">
                  {payableAmount > 0 ? `Rs. ${payableAmount.toLocaleString("en-IN")}` : "Free"}
                </h3>

                <p className="text-muted mb-0">
                  {payableAmount > 0
                    ? "Payment is required after registration."
                    : "Ticket will be generated after registration."}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  function renderDynamicField(field, answers, handleAnswerChange) {
    const fieldId = field.id;
    const type = field.fieldType || field.type || "TEXT";
    const placeholder = field.placeholder || `Enter ${field.label || "answer"}`;
    const required = field.required || false;
    const value = answers[fieldId] || "";

    if (type === "TEXTAREA") {
      return (
        <textarea
          className="form-control"
          rows="3"
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(e) => handleAnswerChange(fieldId, e.target.value)}
        />
      );
    }

    if (type === "SELECT") {
      const options = parseOptions(field.options);

      return (
        <select
          className="form-select"
          required={required}
          value={value}
          onChange={(e) => handleAnswerChange(fieldId, e.target.value)}
        >
          <option value="">Select option</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "CHECKBOX") {
      const options = parseOptions(field.options);

      return (
        <div className="d-grid gap-2">
          {options.map((option) => {
            const selectedValues = Array.isArray(value) ? value : String(value).split(",").filter(Boolean);
            const checked = selectedValues.includes(option);

            return (
              <label className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const nextValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((item) => item !== option);

                    handleAnswerChange(fieldId, nextValues.join(","));
                  }}
                />
                <span className="form-check-label">{option}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (type === "NUMBER") {
      return (
        <input
          className="form-control"
          type="number"
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(e) => handleAnswerChange(fieldId, e.target.value)}
        />
      );
    }

    if (type === "DATE") {
      return (
        <input
          className="form-control"
          type="date"
          required={required}
          value={value}
          onChange={(e) => handleAnswerChange(fieldId, e.target.value)}
        />
      );
    }

    return (
      <input
        className="form-control"
        type={inputType(type)}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => handleAnswerChange(fieldId, e.target.value)}
      />
    );
  }

  function inputType(fieldType) {
    if (fieldType === "EMAIL") return "email";
    if (fieldType === "PHONE") return "tel";
    return "text";
  }

  function parseOptions(options) {
    if (!options) return [];
    if (Array.isArray(options)) return options;

    return String(options)
      .split(/\r?\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  function sanitizeFormFields(fields) {
    return (Array.isArray(fields) ? fields : []).filter((field) => !isReservedTicketField(field));
  }

  function isReservedTicketField(field) {
    const label = String(field?.fieldLabel || field?.label || "").trim().toLowerCase();
    return reservedTicketFieldLabels.has(label);
  }

  function normalizeTicketClass(ticketClass) {
    return {
      ...ticketClass,
      price: Number(ticketClass.price || 0),
      seats: Number(ticketClass.seats || 0),
      sold: Number(ticketClass.sold || 0),
      maxPerBuyer: Math.max(Number(ticketClass.maxPerBuyer || 1), 1)
    };
  }

  function getAvailableSeats(ticketClass) {
    return Math.max(Number(ticketClass.seats || 0) - Number(ticketClass.sold || 0), 0);
  }

  function getMaxSelectableQuantity(ticketClass) {
    return Math.max(Math.min(Number(ticketClass.maxPerBuyer || 1), getAvailableSeats(ticketClass)), 1);
  }

  function formatDate(dateTime) {
    if (!dateTime) return "To be announced";

    return new Date(dateTime).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  export default PublicRegistrationForm;
