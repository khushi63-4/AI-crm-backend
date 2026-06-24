import api from "../api/axios";


export const getLeads = async (params) => {
  return await api.get("/leads", {
    params,
  });
};

export const getLeadById = (id) => {
  return api.get(`/leads/${id}`);
};

export const createLead = async (data) => {
  return await api.post("/leads", data);
};

export const updateLead = (id, data) => {
  return api.put(`/leads/${id}`, data);
};

export const deleteLead = async (id) => {
  return await api.delete(`/leads/${id}`);
};

export const uploadCSV = async (file) => {

  const formData = new FormData();

  formData.append("file", file);

  return await api.post(
    "/leads/upload-csv",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const getFacebookConfig = async () => {
  return await api.get("/leads/facebook/config");
};

export const saveFacebookConfig = async (configData) => {
  return await api.post("/leads/facebook/config", configData);
};

export const triggerFacebookTestWebhook = async (mockLeadData) => {
  return await api.post("/leads/facebook/test-webhook", mockLeadData);
};

export const syncFacebookLeads = async (days) => {
  return await api.post("/leads/facebook/sync", { days });
};


