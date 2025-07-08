import React, { useState, useEffect } from "react";
import "./MailChimpForm.css";
import MailchimpSubscribe from "react-mailchimp-subscribe";

const CustomForm = ({ status, message, onValidated, onClose }) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  console.log("status", status);

  useEffect(() => {
    if (status === "success") clearFields();
  }, [status]);

  const clearFields = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    email &&
      firstName &&
      lastName &&
      email.indexOf("@") > -1 &&
      onValidated({
        EMAIL: email,
        FNAME: firstName,
        LNAME: lastName,
      });
  };

  return (
    <form className="mc__form" onSubmit={(e) => handleSubmit(e)}>
      <h3 className="mc__title">
        {status === "success" ? "Success!" : "Join our email list."}
      </h3>

      {status === "sending" && (
        <div className="mc__alert mc__alert--sending">sending...</div>
      )}
      {status === "error" && (
        <div
          className="mc__alert mc__alert--error"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}
      {status === "success" && (
        <div
          className="mc__alert mc__alert--success"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}

      {status !== "success" ? (
        <div className="mc__field-container">
          {" "}
          <div className="mc__field-container">
            <input
              label="First Name"
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              value={firstName}
              placeholder="First Name"
              isRequired
            />

            <input
              label="Last Name"
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              value={lastName}
              placeholder="Last Name"
              isRequired
            />

            <input
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              value={email}
              placeholder="Email"
              isRequired
            />
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <button onClick={onClose} className="g__justify-self-center">
          Close
        </button>
      ) : (
        <input
          label="subscribe"
          type="submit"
          formValues={[email, firstName, lastName]}
        />
      )}
    </form>
  );
};

const MailchimpFormContainer = (props) => {
  const url = `https://gmail.us18.list-manage.com/subscribe/post?u=14f328dead65028f774016214&id=24e2826a14`;

  return (
    <div className="mc__form-container">
      <MailchimpSubscribe
        url={url}
        render={({ subscribe, status, message }) => (
          <CustomForm
            status={status}
            message={message}
            onClose={props.onClose}
            onValidated={(formData) => subscribe(formData)}
          />
        )}
      />
    </div>
  );
};

export default MailchimpFormContainer;
