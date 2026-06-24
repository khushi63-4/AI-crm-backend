import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiMessageSquare,
  FiPhoneCall,
  FiMessageCircle,
  FiLayers,
  FiUsers,
  FiSend,
  FiCpu,
  FiBarChart2,
  FiSettings
} from "react-icons/fi";

const Sidebar = () => {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FiGrid size={18} /> },
    { name: "Voice Chatbot", path: "/voice-chatbot", icon: <FiMessageSquare size={18} /> },
    { name: "Calling Agent", path: "/calling-agent", icon: <FiPhoneCall size={18} /> },
    { name: "WhatsApp Automation", path: "/whatsapp-automation", icon: <FiMessageCircle size={18} /> },
    { name: "Lead Management", path: "/lead-management", icon: <FiLayers size={18} /> },
    { name: "Contacts", path: "/contacts", icon: <FiUsers size={18} /> },
    { name: "Campaigns", path: "/campaigns", icon: <FiSend size={18} /> },
    { name: "Integrations", path: "/integrations", icon: <FiCpu size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <FiBarChart2 size={18} /> },
    { name: "Settings", path: "/settings", icon: <FiSettings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">A</div>
          <span>AI Engage</span>
        </div>

        <nav>
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-upgrade-card">
          <div className="upgrade-title">Upgrade Plan</div>
          <div className="upgrade-desc">Get access to all premium features</div>
          <button className="upgrade-btn">Upgrade Plan</button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">AS</div>
          <div className="profile-details">
            <span className="profile-name">Aman Singh</span>
            <span className="profile-role">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
