import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const { api, isAuthenticated } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [config, setConfig] = useState(null);

  // Load available clinics on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    api("/configs").then(list => {
      setClinics(list || []);
      if (list?.length > 0 && !clinicId) setClinicId(list[0].clinic_id);
    }).catch(() => {});
  }, [isAuthenticated]);

  // Load config when clinic changes
  useEffect(() => {
    if (!clinicId || !isAuthenticated) return;
    api(`/config/${clinicId}`).then(setConfig).catch(() => setConfig(null));
  }, [clinicId, isAuthenticated]);

  const switchClinic = useCallback((id) => {
    setClinicId(id);
    setConfig(null);
  }, []);

  return (
    <ClinicContext.Provider value={{ clinics, clinicId, switchClinic, config }}>
      {children}
    </ClinicContext.Provider>
  );
}

export const useClinic = () => useContext(ClinicContext);
