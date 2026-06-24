import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const EditLeadModal = ({
  isOpen,
  onClose,
  onSave,
  lead,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    occupation: "",
    investment_amount: "",
    lead_source: "Manual",
    call_output: "DNP",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        city: lead.city || "",
        occupation: lead.occupation || "",
        investment_amount: lead.investment_amount || "",
        lead_source: lead.lead_source || "Manual",
        call_output: lead.call_output || "DNP",
      });
    }
  }, [lead]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(lead.id, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row" style={{ flexShrink: 0 }}>
          <h2>Edit Lead Details</h2>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-grid-form" style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: "8px", margin: "8px 0" }}>
          <div className="modal-form-group">
            <label className="modal-label">Name *</label>
            <input
              name="name"
              type="text"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              className="modal-input"
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Phone No. *</label>
            <input
              name="phone"
              type="text"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              className="modal-input"
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">City</label>
            <input
              name="city"
              type="text"
              placeholder="Enter city"
              value={formData.city}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Occupation</label>
            <input
              name="occupation"
              type="text"
              placeholder="Enter occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Investment Amount</label>
            <input
              name="investment_amount"
              type="number"
              placeholder="Enter investment amount"
              value={formData.investment_amount}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Lead Source</label>
            <select
              name="lead_source"
              value={formData.lead_source}
              onChange={handleChange}
              className="modal-select"
            >
              <option value="Manual">Manual</option>
              <option value="Facebook Meta">Facebook Meta</option>
              <option value="CSV Upload">CSV Upload</option>
            </select>
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Call Output</label>
            <select
              name="call_output"
              value={formData.call_output}
              onChange={handleChange}
              className="modal-select"
            >
              <option value="DNP">DNP</option>
              <option value="Call Back">Call Back</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="Send WhatsApp Details">Send WhatsApp Details</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Converted">Converted</option>
            </select>
          </div>

          <div className="modal-footer modal-form-group full-width" style={{ margin: 0, padding: 0, border: "none" }}>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", width: "100%", borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "12px" }}>
              <button type="button" onClick={onClose} className="modal-btn-cancel">
                Cancel
              </button>
              <button type="submit" className="modal-btn-submit">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;
