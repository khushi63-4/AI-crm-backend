import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiDollarSign, FiShare2, FiCheckSquare, FiCalendar } from "react-icons/fi";

const LeadDetailsModal = ({ isOpen, onClose, lead }) => {
  if (!isOpen || !lead) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const detailItems = [
    { label: "Name", value: lead.name, icon: <FiUser /> },
    { label: "Email", value: lead.email || "N/A", icon: <FiMail /> },
    { label: "Phone No.", value: lead.phone, icon: <FiPhone /> },
    { label: "City", value: lead.city || "N/A", icon: <FiMapPin /> },
    { label: "Occupation", value: lead.occupation || "N/A", icon: <FiBriefcase /> },
    { 
      label: "Investment Amount", 
      value: lead.investment_amount ? `₹${Number(lead.investment_amount).toLocaleString("en-IN")}` : "N/A", 
      icon: <FiDollarSign /> 
    },
    { label: "Lead Source", value: lead.lead_source || "Manual", icon: <FiShare2 /> },
    { label: "Call Output", value: lead.call_output || "New", icon: <FiCheckSquare /> },
    { label: "Created At", value: formatDate(lead.created_at), icon: <FiCalendar /> },
    { label: "Updated At", value: formatDate(lead.updated_at || lead.created_at), icon: <FiCalendar /> },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          maxWidth: "540px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row" style={{ flexShrink: 0 }}>
          <h2>Lead Information</h2>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            paddingRight: "8px",
            margin: "8px 0",
          }}
        >
          {detailItems.map((item, idx) => (
            <div key={idx} style={detailItemStyle}>
              <div style={detailIconStyle}>
                {item.icon}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", marginTop: "2px" }}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer" style={{ border: "none", marginTop: "12px", paddingTop: "12px", flexShrink: 0 }}>
          <button onClick={onClose} className="modal-btn-submit" style={{ width: "100%", padding: "12px 0" }}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

const detailItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "10px 16px",
  backgroundColor: "#f8f9fc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
};

const detailIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  backgroundColor: "#eff6ff",
  color: "#3b82f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  flexShrink: 0,
};

export default LeadDetailsModal;
