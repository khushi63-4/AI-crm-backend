import { useEffect, useState } from "react";
import { getLeads } from "../../services/leadService";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiEye,
  FiMoreVertical,
  FiEdit2,
  FiTrash,
} from "react-icons/fi";

const LeadsTable = ({ filters, onDelete, onEdit, onView, onLeadsLoaded, onSelectionChange }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Propagate selection changes up to parent
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedLeadIds);
    }
  }, [selectedLeadIds]);

  // Synchronously reset page when filters change
  const [prevFilters, setPrevFilters] = useState(filters);
  if (filters !== prevFilters) {
    setPage(1);
    setPrevFilters(filters);
  }

  useEffect(() => {
    fetchLeads();
  }, [filters, page, limit]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveDropdownId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLeads({
        ...filters,
        page,
        limit,
      });

      const loadedLeads = response.data.data || [];
      setLeads(loadedLeads);
      setTotal(response.data.total || 0);
      
      if (onLeadsLoaded) {
        onLeadsLoaded(loadedLeads);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (leadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const isAllSelected = leads.length > 0 && leads.every((lead) => selectedLeadIds.includes(lead.id));

  const handleSelectAllChange = () => {
    if (isAllSelected) {
      const leadIdsOnPage = leads.map((lead) => lead.id);
      setSelectedLeadIds((prev) => prev.filter((id) => !leadIdsOnPage.includes(id)));
    } else {
      const leadIdsOnPage = leads.map((lead) => lead.id);
      setSelectedLeadIds((prev) => {
        const newSelections = [...prev];
        leadIdsOnPage.forEach((id) => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  };

  const getSourceClass = (source) => {
    if (!source) return "source-default";
    const s = source.toLowerCase();
    if (s.includes("facebook")) return "source-facebook";
    if (s.includes("hubspot")) return "source-hubspot";
    if (s.includes("csv")) return "source-csv";
    if (s.includes("manual")) return "source-manual";
    return "source-default";
  };

  const getStatusClass = (status) => {
    if (!status) return "status-default";
    const s = status.toLowerCase();
    if (s === "interested" || s === "converted") return "status-interested";
    if (s === "call back" || s === "follow up") return "status-callback";
    if (s === "not interested" || s === "dnp") return "status-notinterested";
    if (s === "no answer" || s === "wrong number") return "status-noanswer";
    return "status-default";
  };

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

  if (loading) {
    return <p>Loading leads...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (leads.length === 0) {
    return <p>No leads found.</p>;
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const getPageNumbers = () => {
    const range = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input 
                  type="checkbox" 
                  className="crm-checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAllChange}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone No.</th>
              <th>City</th>
              <th>Occupation</th>
              <th>Investment Amount</th>
              <th>Call Output</th>
              <th>Lead Source</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input 
                    type="checkbox" 
                    className="crm-checkbox" 
                    checked={selectedLeadIds.includes(lead.id)}
                    onChange={() => handleCheckboxChange(lead.id)}
                  />
                </td>
                <td style={{ fontWeight: 600, color: "#0f172a" }}>{lead.name}</td>
                <td>{lead.email || "-"}</td>
                <td>{lead.phone}</td>
                <td>{lead.city || "-"}</td>
                <td>{lead.occupation || "-"}</td>
                <td>
                  {lead.investment_amount ? `₹${Number(lead.investment_amount).toLocaleString("en-IN")}` : "-"}
                </td>
                <td>
                  <span className={`badge-status ${getStatusClass(lead.call_output)}`}>
                    {lead.call_output || "New"}
                  </span>
                </td>
                <td>
                  <span className={`badge-source ${getSourceClass(lead.lead_source)}`}>
                    {lead.lead_source || "Manual"}
                  </span>
                </td>
                <td>{formatDate(lead.created_at)}</td>
                <td>{formatDate(lead.updated_at || lead.created_at)}</td>

                <td>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                    <button
                      className="table-action-icon-btn"
                      title="View Details"
                      onClick={() => onView(lead)}
                    >
                      <FiEye size={16} />
                    </button>
                    
                    <div className="actions-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id);
                        }}
                        className="table-action-icon-btn"
                        title="Options"
                      >
                        <FiMoreVertical size={16} />
                      </button>

                      {activeDropdownId === lead.id && (
                        <div className="actions-dropdown-menu">
                          <button
                            className="actions-dropdown-item"
                            onClick={() => {
                              onEdit(lead);
                              setActiveDropdownId(null);
                            }}
                          >
                            <FiEdit2 size={14} />
                            Edit
                          </button>
                          <button
                            className="actions-dropdown-item delete"
                            onClick={() => {
                              onDelete(lead.id);
                              setActiveDropdownId(null);
                            }}
                          >
                            <FiTrash size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="pagination-container" style={{ padding: "16px 24px", backgroundColor: "#ffffff" }}>
        <div className="pagination-info">
          <span>
            Showing <strong>{total === 0 ? 0 : (page - 1) * limit + 1}</strong> to{" "}
            <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> leads
          </span>
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="pagination-btn"
            title="First Page"
          >
            <FiChevronsLeft size={16} />
          </button>
          
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="pagination-btn"
            title="Previous Page"
          >
            <FiChevronLeft size={16} />
          </button>

          {getPageNumbers().map((p, index) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`pagination-btn ${isActive ? "active" : ""}`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="pagination-btn"
            title="Next Page"
          >
            <FiChevronRight size={16} />
          </button>
          
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="pagination-btn"
            title="Last Page"
          >
            <FiChevronsRight size={16} />
          </button>

          <div className="page-size-selector" style={{ marginLeft: "12px" }}>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="page-size-select"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;