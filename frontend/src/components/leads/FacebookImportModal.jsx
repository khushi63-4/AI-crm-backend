import { useState, useEffect } from "react";
import { 
  FiX, 
  FiFacebook, 
  FiCopy, 
  FiCheck, 
  FiKey, 
  FiGlobe, 
  FiPlay, 
  FiRefreshCw, 
  FiServer, 
  FiDatabase, 
  FiUserCheck, 
  FiArrowRight 
} from "react-icons/fi";
import { 
  getFacebookConfig, 
  saveFacebookConfig, 
  triggerFacebookTestWebhook,
  syncFacebookLeads
} from "../../services/leadService";

function FacebookImportModal({ isOpen, onClose, onImportSuccess }) {
  const [config, setConfig] = useState({
    access_token: "",
    page_id: "",
    verify_token: "fb_crm_secret_token_123",
    public_webhook_url: ""
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: "", message: "" });
  const [testLeadType, setTestLeadType] = useState("real_estate");
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState({ type: "", message: "" });
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ type: "", message: "" });
  const [syncDays, setSyncDays] = useState("7");

  const webhookUrl = `${window.location.origin.replace(':5173', ':5000')}/api/leads/facebook/webhook`;

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setSaveStatus({ type: "", message: "" });
      setTestStatus({ type: "", message: "" });
      setSyncStatus({ type: "", message: "" });
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await getFacebookConfig();
      if (response.data) {
        setConfig({
          access_token: response.data.access_token || "",
          page_id: response.data.page_id || "",
          verify_token: response.data.verify_token || "fb_crm_secret_token_123",
          public_webhook_url: response.data.public_webhook_url || ""
        });
      }
    } catch (err) {
      console.error("Failed to load Facebook config", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(config.public_webhook_url || webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateVerifyToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "fb_";
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig(prev => ({ ...prev, verify_token: token }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setSaveStatus({ type: "", message: "" });
      await saveFacebookConfig(config);
      setSaveStatus({ type: "success", message: "Configuration saved successfully!" });
    } catch (err) {
      console.error(err);
      setSaveStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to save configuration." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Preset Mock Leads
  const testLeadsPresets = {
    real_estate: {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "9876543210",
      city: "Mumbai",
      occupation: "Business Owner",
      investment_amount: "1500000"
    },
    tech_lead: {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "8765432109",
      city: "Bangalore",
      occupation: "Software Architect",
      investment_amount: "800000"
    },
    investor: {
      name: "Amit Verma",
      email: "amit.verma@example.com",
      phone: "7654321098",
      city: "Delhi",
      occupation: "Senior Consultant",
      investment_amount: "2500000"
    }
  };

  const handleTestLeadSubmit = async () => {
    try {
      setTestLoading(true);
      setTestStatus({ type: "", message: "" });
      
      const payload = testLeadsPresets[testLeadType];
      const response = await triggerFacebookTestWebhook(payload);

      setTestStatus({ 
        type: "success", 
        message: `Simulated lead imported successfully! ID: ${response.data.leadId}` 
      });

      if (onImportSuccess) {
        // Allow a small delay for user to read success message before refreshing/updating
        setTimeout(() => {
          onImportSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setTestStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to process test lead." 
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncLeads = async () => {
    try {
      setSyncLoading(true);
      setSyncStatus({ type: "", message: "" });
      
      const response = await syncFacebookLeads(syncDays);
      const { totalChecked, importedCount, skippedCount } = response.data;
      
      setSyncStatus({ 
        type: "success", 
        message: `Sync complete! Checked ${totalChecked} leads from Facebook. Imported ${importedCount} new leads (${skippedCount} duplicates skipped).` 
      });

      if (onImportSuccess && importedCount > 0) {
        onImportSuccess();
      }
    } catch (err) {
      console.error(err);
      setSyncStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to sync leads. Please check your Access Token and Page ID." 
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          maxWidth: "640px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-row" style={{ flexShrink: 0, marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiFacebook size={24} color="#1877f2" />
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Facebook Meta Ads Integration</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <FiX size={20} />
          </button>
        </div>

        {/* Integration Flowchart diagram */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
        }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Automatic Webhook Lead Flow
          </p>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#475569",
            fontWeight: 500,
            gap: "8px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18%" }}>
              <div style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "8px", borderRadius: "50%", marginBottom: "6px" }}>
                <FiUserCheck size={16} />
              </div>
              <span style={{ textAlign: "center", lineHeight: "1.2" }}>Lead Form Submission</span>
            </div>
            
            <FiArrowRight size={14} color="#cbd5e1" style={{ marginTop: "-20px" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18%" }}>
              <div style={{ backgroundColor: "#fdf2f8", color: "#db2777", padding: "8px", borderRadius: "50%", marginBottom: "6px" }}>
                <FiFacebook size={16} />
              </div>
              <span style={{ textAlign: "center", lineHeight: "1.2" }}>Meta Event Hook</span>
            </div>

            <FiArrowRight size={14} color="#cbd5e1" style={{ marginTop: "-20px" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18%" }}>
              <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "8px", borderRadius: "50%", marginBottom: "6px" }}>
                <FiServer size={16} />
              </div>
              <span style={{ textAlign: "center", lineHeight: "1.2" }}>CRM Server Fetches</span>
            </div>

            <FiArrowRight size={14} color="#cbd5e1" style={{ marginTop: "-20px" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18%" }}>
              <div style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", padding: "8px", borderRadius: "50%", marginBottom: "6px" }}>
                <FiDatabase size={16} />
              </div>
              <span style={{ textAlign: "center", lineHeight: "1.2" }}>Lead Saved to DB</span>
            </div>

            <FiArrowRight size={14} color="#cbd5e1" style={{ marginTop: "-20px" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18%" }}>
              <div style={{ backgroundColor: "#fff7ed", color: "#ea580c", padding: "8px", borderRadius: "50%", marginBottom: "6px" }}>
                <FiRefreshCw size={16} />
              </div>
              <span style={{ textAlign: "center", lineHeight: "1.2" }}>Appears in CRM</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 380px)", paddingRight: "4px" }}>
          
          {/* Configuration Form */}
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Step 1: Webhook Config */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                Step 1: Configure Webhook URL in Meta Developers Portal
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="modal-form-group">
                  <label className="modal-label">Webhook Callback URL</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      value={config.public_webhook_url} 
                      onChange={(e) => setConfig(prev => ({ ...prev, public_webhook_url: e.target.value }))}
                      placeholder={webhookUrl}
                      className="modal-input" 
                      style={{ flex: 1, fontFamily: "monospace", fontSize: "12px" }}
                    />
                    <button 
                      type="button" 
                      onClick={handleCopyWebhook}
                      className="modal-btn-cancel" 
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid #cbd5e1" }}
                    >
                      {copied ? <FiCheck size={14} color="#16a34a" /> : <FiCopy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Provide a public HTTPS endpoint (e.g. from ngrok, cloudflare tunnel, or domain) so Meta can reach your CRM server. Fallback to default if empty.
                  </span>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Verify Token</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      value={config.verify_token} 
                      onChange={(e) => setConfig(prev => ({ ...prev, verify_token: e.target.value }))}
                      placeholder="Enter a verification token"
                      className="modal-input" 
                      style={{ flex: 1, fontFamily: "monospace", fontSize: "13px" }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={handleGenerateVerifyToken}
                      className="modal-btn-cancel" 
                      style={{ padding: "8px 12px" }}
                    >
                      Generate
                    </button>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Matches the Verify Token value you input inside Facebook Lead Ads webhook dashboard subscription.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Page Credentials */}
            <div style={{ marginTop: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                Step 2: Add API Credentials (to download lead fields)
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="modal-form-group">
                  <label className="modal-label">Facebook Page ID</label>
                  <input 
                    type="text" 
                    value={config.page_id} 
                    onChange={(e) => setConfig(prev => ({ ...prev, page_id: e.target.value }))}
                    placeholder="e.g. 1048956749034"
                    className="modal-input" 
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Facebook Graph Page Access Token</label>
                  <input 
                    type="password" 
                    value={config.access_token} 
                    onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                    placeholder="EAA..."
                    className="modal-input" 
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Requires <code>pages_manage_metadata</code>, <code>pages_show_list</code> and <code>leads_retrieval</code> permissions.
                  </span>
                </div>
              </div>
            </div>

            {/* Save Status */}
            {saveStatus.message && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: saveStatus.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: saveStatus.type === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${saveStatus.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {saveStatus.message}
              </div>
            )}

            {/* Submit Config */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="submit" 
                className="modal-btn-submit"
                disabled={loading}
                style={{ padding: "8px 20px" }}
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>

          {/* Step 3: Sync On-Demand */}
          <div style={{ 
            marginTop: "20px", 
            padding: "16px", 
            backgroundColor: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: "10px" 
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "#1e293b" }}>
              Step 3: Pull Leads Directly from Facebook (On-Demand Sync)
            </h3>
            <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Instantly pull all new lead submissions from your Facebook Page Forms using your saved API credentials. No webhook configuration or ngrok tunnels required.
            </p>

            <div className="modal-form-group" style={{ marginBottom: "16px" }}>
              <label className="modal-label" style={{ fontWeight: "600", fontSize: "12px", color: "#475569", marginBottom: "6px", display: "block" }}>
                Sync Timeline Window
              </label>
              <select 
                value={syncDays} 
                onChange={(e) => setSyncDays(e.target.value)}
                className="modal-select"
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "6px", 
                  border: "1px solid #cbd5e1", 
                  fontSize: "13px", 
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  outline: "none"
                }}
              >
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="all">All Available (90 Days)</option>
              </select>
            </div>
            
            {syncStatus.message && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "12px",
                backgroundColor: syncStatus.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: syncStatus.type === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${syncStatus.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {syncStatus.message}
              </div>
            )}

            <button 
              type="button" 
              onClick={handleSyncLeads}
              disabled={syncLoading}
              className="modal-btn-submit"
              style={{ 
                backgroundColor: "#16a34a", 
                color: "#ffffff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: "600",
                width: "100%",
                cursor: syncLoading ? "not-allowed" : "pointer"
              }}
            >
              {syncLoading ? (
                <>
                  <FiRefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Syncing Leads from Facebook...
                </>
              ) : (
                <>
                  <FiRefreshCw size={14} />
                  Sync Facebook Leads Now
                </>
              )}
            </button>
          </div>

          {/* Webhook Testing Simulator Panel */}
          <div style={{
            marginTop: "24px",
            borderTop: "2px dashed #e2e8f0",
            paddingTop: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ backgroundColor: "#e0e7ff", color: "#4f46e5", padding: "4px", borderRadius: "6px" }}>
                <FiPlay size={16} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Developer Sandbox: Test Webhook Simulation
              </h3>
            </div>
            
            <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Simulate an instant lead webhook payload submission to test data pipelines without setting up live tunnels or developer credentials.
            </p>

            <div style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div className="modal-form-group">
                <label className="modal-label">Select Sample Lead Profile</label>
                <select 
                  value={testLeadType} 
                  onChange={(e) => setTestLeadType(e.target.value)}
                  className="modal-select"
                >
                  <option value="real_estate">Rahul Sharma - Real Estate (Mumbai, ₹15L investment)</option>
                  <option value="tech_lead">Priya Patel - Software Architect (Bangalore, ₹8L investment)</option>
                  <option value="investor">Amit Verma - Senior Consultant (Delhi, ₹25L investment)</option>
                </select>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "11px",
                color: "#64748b",
                backgroundColor: "#ffffff",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #f1f5f9"
              }}>
                <div><strong>Name:</strong> {testLeadsPresets[testLeadType].name}</div>
                <div><strong>Email:</strong> {testLeadsPresets[testLeadType].email}</div>
                <div><strong>Phone:</strong> {testLeadsPresets[testLeadType].phone}</div>
                <div><strong>City:</strong> {testLeadsPresets[testLeadType].city}</div>
              </div>

              {testStatus.message && (
                <div style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  backgroundColor: testStatus.type === "success" ? "#eff6ff" : "#fef2f2",
                  color: testStatus.type === "success" ? "#1d4ed8" : "#dc2626",
                  border: `1px solid ${testStatus.type === "success" ? "#bfdbfe" : "#fecaca"}`,
                }}>
                  {testStatus.message}
                </div>
              )}

              <button 
                type="button" 
                onClick={handleTestLeadSubmit}
                disabled={testLoading}
                className="modal-btn-submit"
                style={{ 
                  backgroundColor: "#4f46e5", 
                  color: "#ffffff", 
                  width: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  fontSize: "13px"
                }}
              >
                {testLoading ? (
                  <>
                    <FiRefreshCw size={14} className="spin-icon" style={{ animation: "spin 1s linear infinite" }} />
                    Injecting Mock Lead...
                  </>
                ) : (
                  <>
                    <FiPlay size={14} />
                    Trigger Simulated Webhook Lead
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "12px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn-cancel"
            style={{ padding: "8px 16px" }}
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacebookImportModal;
