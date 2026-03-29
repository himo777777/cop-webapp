import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const { api, isAuthenticated } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [config, setConfig] = useState(null);
  const [uiConfig, setUiConfig] = useState(null);

  // Load available clinics on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    api("/configs").then(list => {
      setClinics(list || []);
      if (list?.length > 0 && !clinicId) setClinicId(list[0].clinic_id);
    }).catch(() => {});
  }, [isAuthenticated]);

  // Load config + ui-config when clinic changes
  useEffect(() => {
    if (!clinicId || !isAuthenticated) return;
    api(`/config/${clinicId}`).then(setConfig).catch(() => setConfig(null));
    api(`/clinic/${clinicId}/ui-config`).then(setUiConfig).catch(() => setUiConfig(null));
  }, [clinicId, isAuthenticated]);

  const switchClinic = useCallback((id) => {
    setClinicId(id);
    setConfig(null);
    setUiConfig(null);
  }, []);

  // Helper: get function options for dropdowns (day functions + ledig)
  const getFunctionOptions = useCallback((includeEmpty = true) => {
    if (!uiConfig) return [];
    const opts = includeEmpty ? [{ value: "", label: "-- Välj funktion --" }] : [];
    return [...opts, ...uiConfig.day_functions.map(f => ({ value: f.value, label: f.label }))];
  }, [uiConfig]);

  // Helper: get role options
  const getRoleOptions = useCallback((allRoles = false) => {
    if (!uiConfig) return [];
    return allRoles ? uiConfig.all_roles : uiConfig.roles;
  }, [uiConfig]);

  // Helper: get sites
  const getSites = useCallback(() => {
    return uiConfig?.sites || [];
  }, [uiConfig]);

  return (
    <ClinicContext.Provider value={{
      clinics, clinicId, switchClinic, config, uiConfig,
      getFunctionOptions, getRoleOptions, getSites,
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export const useClinic = () => useContext(ClinicContext);
