import { FiSearch, FiCalendar } from "react-icons/fi";

const SearchFilters = ({
  filters,
  setFilters,
  onReset,
}) => {
  return (
    <div className="filter-bar-container">
      {/* Search */}
      <div className="filter-input-wrapper">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={filters.search}
          className="filter-input"
          onChange={(e) =>
            setFilters({
              ...filters,
              search: e.target.value,
            })
          }
        />
        <FiSearch className="filter-input-icon" size={16} />
      </div>

      {/* Lead Source */}
      <select
        value={filters.lead_source}
        className="filter-select"
        onChange={(e) =>
          setFilters({
            ...filters,
            lead_source: e.target.value,
          })
        }
      >
        <option value="">All Sources</option>
        <option value="Manual">Manual</option>
        <option value="CSV Upload">CSV Upload</option>
        <option value="Facebook Meta">Facebook Meta</option>
      </select>

      {/* Call Output */}
      <select
        value={filters.call_output}
        className="filter-select"
        onChange={(e) =>
          setFilters({
            ...filters,
            call_output: e.target.value,
          })
        }
      >
        <option value="">All Call Outputs</option>
        <option value="DNP">DNP</option>
        <option value="Call Back">Call Back</option>
        <option value="Wrong Number">Wrong Number</option>
        <option value="Send WhatsApp Details">Send WhatsApp Details</option>
        <option value="Not Interested">Not Interested</option>
        <option value="Follow Up">Follow Up</option>
        <option value="Converted">Converted</option>
      </select>

      {/* Start Date */}
      <div className="filter-date-wrapper">
        <FiCalendar className="filter-date-icon" size={16} />
        <input
          type="date"
          value={filters.startDate}
          className="filter-date-input"
          placeholder="Start Date"
          onChange={(e) =>
            setFilters({
              ...filters,
              startDate: e.target.value,
            })
          }
        />
      </div>

      {/* End Date */}
      <div className="filter-date-wrapper">
        <FiCalendar className="filter-date-icon" size={16} />
        <input
          type="date"
          value={filters.endDate}
          className="filter-date-input"
          placeholder="End Date"
          onChange={(e) =>
            setFilters({
              ...filters,
              endDate: e.target.value,
            })
          }
        />
      </div>

      {/* Reset */}
      <button className="filter-btn-reset" onClick={onReset}>
        Reset
      </button>
    </div>
  );
};

export default SearchFilters;