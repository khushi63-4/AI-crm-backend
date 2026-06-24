import { FiMenu, FiBell } from "react-icons/fi";

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" title="Toggle Menu">
          <FiMenu size={20} />
        </button>
      </div>

      <div className="header-right">
        <button className="notification-btn" title="Notifications">
          <FiBell size={20} />
          <span className="notification-badge"></span>
        </button>

        <div className="user-dropdown-trigger">
          <div className="user-avatar-sm">AS</div>
          <span className="user-name-sm">Aman Singh</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
