import { useState, useRef } from "react";
import { FiX, FiUploadCloud, FiFileText } from "react-icons/fi";

function UploadCSVModal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select CSV file");
      return;
    }

    await onUpload(file);
    setFile(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        alert("Please upload a CSV file only.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-container"
        style={{
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row" style={{ flexShrink: 0 }}>
          <h2>Upload CSV</h2>
          <button className="modal-close-btn" onClick={handleClose} title="Close Modal">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            style={{
              border: `2px dashed ${isDragActive ? "#4f46e5" : "#cbd5e1"}`,
              borderRadius: "12px",
              padding: "30px 20px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragActive ? "#f5f3ff" : "#f8fafc",
              transition: "all 0.2s ease-in-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              style={{ display: "none" }}
            />
            {file ? (
              <>
                <FiFileText size={40} color="#4f46e5" />
                <div>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", margin: 0 }}>{file.name}</p>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", margin: "4px 0 0 0" }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#ef4444",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: "4px",
                  }}
                >
                  Remove File
                </button>
              </>
            ) : (
              <>
                <FiUploadCloud size={40} color="#94a3b8" />
                <div>
                  <p style={{ fontWeight: 600, color: "#334155", fontSize: "14px", margin: 0 }}>
                    Drag & drop your CSV file here
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", margin: "4px 0 0 0" }}>
                    Or click to browse files
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer" style={{ border: "none", marginTop: "0", paddingTop: "0", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleClose}
              className="modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={!file}
              style={{ opacity: file ? 1 : 0.6, cursor: file ? "pointer" : "not-allowed" }}
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadCSVModal;