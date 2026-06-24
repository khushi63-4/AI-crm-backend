import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/dashboardService";
import {
  FiUsers,
  FiFacebook,
  FiFileText,
  FiUserPlus,
  FiLink
} from "react-icons/fi";

const SummaryCards = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) {
    return <div className="summary-cards-container">Loading metrics...</div>;
  }

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("en-IN");
  };

  const cardsData = [
    {
      title: "Total Leads",
      value: formatNumber(stats.totalLeads),
      change: "+12%",
      isPositive: true,
      icon: <FiUsers size={22} />,
      iconClass: "icon-purple",
    },
    {
      title: "Facebook Leads",
      value: formatNumber(stats.facebookLeads),
      change: "+8%",
      isPositive: true,
      icon: <FiFacebook size={22} />,
      iconClass: "icon-blue",
    },
    {
      title: "CSV Leads",
      value: formatNumber(stats.csvLeads),
      change: "-3%",
      isPositive: false,
      icon: <FiFileText size={22} />,
      iconClass: "icon-green",
    },
    {
      title: "Manual Leads",
      value: formatNumber(stats.manualLeads),
      change: "+5%",
      isPositive: true,
      icon: <FiUserPlus size={22} />,
      iconClass: "icon-purple",
    },
  ];

  return (
    <div className="summary-cards-container">
      {cardsData.map((card, idx) => (
        <div key={idx} className="summary-card">
          <div className={`summary-card-icon-wrapper ${card.iconClass}`}>
            {card.icon}
          </div>
          <div className="summary-card-details">
            <span className="summary-card-title">{card.title}</span>
            <div className="summary-card-value-row">
              <span className="summary-card-value">{card.value}</span>
            </div>
            <span className="summary-card-vs">vs last 30 days</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;