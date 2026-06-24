import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import LeadManagement from "../pages/LeadManagement";
import Layout from "../components/layout/Layout";

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/lead-management"
          element={<LeadManagement />}
        />
      </Routes>
    </Layout>
  );
};

export default AppRoutes;