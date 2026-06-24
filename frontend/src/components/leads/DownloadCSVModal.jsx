import { useState, useEffect } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import { getLeads } from "../../services/leadService";
import api from "../../api/axios";

function DownloadCSVModal({
  isOpen,
  onClose,
  currentPageLeads = [],
  selectedLeadIds = [],
}) {
  const [loading, setLoading] = useState(false);
  const [activeOption, setActiveOption] = useState("all");

  // Sync activeOption selection when modal opens or selections change
  useEffect(() => {
    if (isOpen) {
      setActiveOption(selectedLeadIds.length > 0 ? "selected" : "all");
    }
  }, [isOpen, selectedLeadIds.length]);

  if (!isOpen) return null;

  const selectedCount = selectedLeadIds.length;
  const pageCount = currentPageLeads.length;

  const handleDownload = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      let filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

      if (activeOption === "all") {
        filename = `all-leads-${filename}`;
      } else if (activeOption === "page") {
        const ids = currentPageLeads.map((l) => l.id).join(",");
        queryParams.push(`ids=${ids}`);
        filename = `page-leads-${filename}`;
      } else if (activeOption === "selected") {
        const ids = selectedLeadIds.join(",");
        queryParams.push(`ids=${ids}`);
        filename = `selected-leads-${filename}`;
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      
      const response = await api.get(`/leads/export-csv${queryString}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to export leads CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row" style={{ flexShrink: 0 }}>
          <h2>Download Leads CSV</h2>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <FiX size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "10px 0" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
            Select how you would like to export your leads list:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Option 1: All Leads */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                border: `1px solid ${activeOption === "all" ? "#6366f1" : "#e2e8f0"}`,
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: activeOption === "all" ? "#f5f3ff" : "#ffffff",
                transition: "all 0.2s",
              }}
            >
              <input
                type="radio"
                name="downloadOption"
                value="all"
                checked={activeOption === "all"}
                onChange={() => setActiveOption("all")}
                style={{ cursor: "pointer", accentColor: "#6366f1" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                  All Leads in CRM
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Downloads every lead record present in the database.
                </span>
              </div>
            </label>

            {/* Option 2: Current Page */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                border: `1px solid ${activeOption === "page" ? "#6366f1" : "#e2e8f0"}`,
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: activeOption === "page" ? "#f5f3ff" : "#ffffff",
                transition: "all 0.2s",
              }}
            >
              <input
                type="radio"
                name="downloadOption"
                value="page"
                checked={activeOption === "page"}
                onChange={() => setActiveOption("page")}
                style={{ cursor: "pointer", accentColor: "#6366f1" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                  Current Page Leads ({pageCount})
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Downloads only the {pageCount} leads displayed on this screen.
                </span>
              </div>
            </label>

            {/* Option 3: Selected Leads */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                border: `1px solid ${activeOption === "selected" ? "#6366f1" : "#e2e8f0"}`,
                borderRadius: "8px",
                cursor: selectedCount > 0 ? "pointer" : "not-allowed",
                backgroundColor: activeOption === "selected" ? "#f5f3ff" : "#ffffff",
                opacity: selectedCount > 0 ? 1 : 0.5,
                transition: "all 0.2s",
              }}
            >
              <input
                type="radio"
                name="downloadOption"
                value="selected"
                disabled={selectedCount === 0}
                checked={activeOption === "selected"}
                onChange={() => setActiveOption("selected")}
                style={{ cursor: selectedCount > 0 ? "pointer" : "not-allowed", accentColor: "#6366f1" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                  Selected Leads ({selectedCount})
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Downloads only checked leads ({selectedCount} selected).
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ border: "none", marginTop: "10px", paddingTop: "10px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="modal-btn-submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minWidth: "120px",
            }}
          >
            <FiDownload size={16} />
            {loading ? "Exporting..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadCSVModal;
