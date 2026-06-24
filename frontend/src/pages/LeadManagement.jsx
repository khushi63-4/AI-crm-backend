import { useState } from "react";

import {
  createLead,
  uploadCSV,
  deleteLead,
  updateLead,
} from "../services/leadService";

import SummaryCards from "../components/leads/SummaryCards";
import ActionButtons from "../components/leads/ActionButtons";
import SearchFilters from "../components/leads/SearchFilters";
import LeadTable from "../components/leads/LeadTable";
import AddLeadModal from "../components/leads/AddLeadModal";
import UploadCSVModal from "../components/leads/UploadCSVModal";
import EditLeadModal from "../components/leads/EditLeadModal";
import LeadDetailsModal from "../components/leads/LeadDetailsDrawer";
import FacebookImportModal from "../components/leads/FacebookImportModal";
import DownloadCSVModal from "../components/leads/DownloadCSVModal";

const LeadManagement = () => {
  // Modal States
  const [showAddLead, setShowAddLead] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [currentPageLeads, setCurrentPageLeads] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    lead_source: "",
    call_output: "",
    startDate: "",
    endDate: "",
  });

  // ==========================
  // CREATE LEAD
  // ==========================
  const handleCreateLead = async (leadData) => {
    try {
      await createLead(leadData);

      alert("Lead Added Successfully");

      setShowAddLead(false);

      // Temporary Refresh
      window.location.reload();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed To Add Lead";
      alert(errMsg);
    }
  };

  // ==========================
  // UPDATE LEAD
  // ==========================
  const handleUpdateLead = async (id, leadData) => {
    try {
      await updateLead(id, leadData);

      alert("Lead Updated Successfully");

      setShowEditModal(false);

      // Temporary Refresh
      window.location.reload();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed To Update Lead";
      alert(errMsg);
    }
  };

  // ==========================
  // CSV UPLOAD
  // ==========================
  const handleCSVUpload = async (file) => {
    try {
      await uploadCSV(file);

      alert("CSV Uploaded Successfully");

      setShowCSVUpload(false);

      // Temporary Refresh
      window.location.reload();
    } catch (error) {
      console.error(error);

      alert("CSV Upload Failed");
    }
  };

  // ==========================
  // DELETE LEAD
  // ==========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) return;

    try {
      await deleteLead(id);

      alert("Lead Deleted Successfully");

      // Temporary Refresh
      window.location.reload();
    } catch (error) {
      console.error(error);

      alert("Failed To Delete Lead");
    }
  };

  const handleEditClick = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleViewClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  return (
    <div style={{ padding: "0px" }}>
      <div className="header-actions-row">
        <div className="header-title-section">
          <h1>Lead Management</h1>
          <p>Manage leads from different sources in one place.</p>
        </div>

        <ActionButtons
          onAddLead={() => setShowAddLead(true)}
          onUploadCSV={() => setShowCSVUpload(true)}
          onImportFacebook={() => setShowFacebookModal(true)}
          onDownloadCSV={() => setShowDownloadModal(true)}
        />
      </div>

      <SummaryCards />

      <SearchFilters
        filters={filters}
        setFilters={setFilters}
        onReset={() =>
          setFilters({
            search: "",
            lead_source: "",
            call_output: "",
            startDate: "",
            endDate: "",
          })
        }
      />

      <LeadTable
        filters={filters}
        onDelete={handleDelete}
        onEdit={handleEditClick}
        onView={handleViewClick}
        onLeadsLoaded={setCurrentPageLeads}
        onSelectionChange={setSelectedLeadIds}
      />

      <AddLeadModal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSave={handleCreateLead}
      />

      <UploadCSVModal
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onUpload={handleCSVUpload}
      />

      <FacebookImportModal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        onImportSuccess={() => window.location.reload()}
      />

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateLead}
        lead={selectedLead}
      />

      <LeadDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        lead={selectedLead}
      />

      <DownloadCSVModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        currentPageLeads={currentPageLeads}
        selectedLeadIds={selectedLeadIds}
      />
    </div>
  );
};

export default LeadManagement;