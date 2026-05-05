import React, { useState } from "react";
import "./MailChimpForm.css";

const MailchimpFormContainer = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'
  const [message, setMessage] = useState("");

  const clearFields = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !firstName || !lastName || !email.includes("@")) {
      setStatus("error");
      setMessage("Please fill in all fields with a valid email.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const apiBase =
        process.env.NODE_ENV === "development"
          ? "http://localhost:4001"
          : "";

      const res = await fetch(`${apiBase}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          source: "website-modal",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        clearFields();
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again later.");
    }
  };

  return (
    <div className="mc__form-container">
      <form className="mc__form" onSubmit={handleSubmit}>
        <h3 className="mc__title">
          {status === "success" ? "Success!" : "Join our email list."}
        </h3>

        {status === "sending" && (
          <div className="mc__alert mc__alert--sending">sending...</div>
        )}
        {status === "error" && (
          <div className="mc__alert mc__alert--error">{message}</div>
        )}
        {status === "success" && (
          <div className="mc__alert mc__alert--success">{message}</div>
        )}

        {status !== "success" ? (
          <div className="mc__field-container">
            <input
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              value={firstName}
              placeholder="First Name"
              required
            />
            <input
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              value={lastName}
              placeholder="Last Name"
              required
            />
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              value={email}
              placeholder="Email"
              required
            />
          </div>
        ) : null}

        {status === "success" ? (
          <button type="button" onClick={onClose} className="g__justify-self-center">
            Close
          </button>
        ) : (
          <input type="submit" value="Subscribe" />
        )}
      </form>
    </div>
  );
};

export default MailchimpFormContainer;
