import React from "react";
import { useAlert } from "./AlertProvider"; // Import the context

import "./Alert.css";

const Alert = () => {
  const { alert } = useAlert();

  if (!alert) return null;

  let alertClass = "";
  switch (alert.type) {
    case "success":
      alertClass = "alert-success";
      break;
    case "warning":
      alertClass = "alert-warning";
      break;
    case "error":
      alertClass = "alert-error";
      break;
    default:
      alertClass = "alert-info";
  }

  return (
    <div
      className={`alert ${alertClass}`}
      role={alert.type === "error" || alert.type === "warning" ? "alert" : "status"}
    >
      <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
      {alert.message}
    </div>
  );
};

export default Alert;
