import { FiFacebook, FiDownload, FiUpload, FiPlus } from "react-icons/fi";

const ActionButtons = ({
  onAddLead,
  onUploadCSV,
  onImportFacebook,
  onDownloadCSV,
}) => {
  return (
    <div className="actions-buttons-group">
      <button className="btn-secondary-action" onClick={onImportFacebook}>
        <FiFacebook size={16} color="#1d4ed8" />
        Import from Facebook
      </button>

      <button className="btn-secondary-action" onClick={onDownloadCSV}>
        <FiDownload size={16} color="#0284c7" />
        Download Leads CSV
      </button>

      <button className="btn-secondary-action" onClick={onUploadCSV}>
        <FiUpload size={16} color="#16a34a" />
        Upload CSV
      </button>

      <button className="btn-primary-action" onClick={onAddLead}>
        <FiPlus size={16} />
        Add Lead
      </button>
    </div>
  );
};

export default ActionButtons;