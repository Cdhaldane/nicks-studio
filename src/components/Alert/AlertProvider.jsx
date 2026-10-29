import React, { createContext, useContext, useRef, useState } from "react";

const AlertContext = createContext();

export const useAlert = () => {
  return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const hideTimer = useRef(null);

  // Function to show the alert
  const showAlert = (type, message) => {
    setAlert({ type, message });
    // Restart the clock, or an earlier alert's timer cuts this one short.
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setAlert(null); // Hide the alert after 5 seconds
    }, 5000);
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
