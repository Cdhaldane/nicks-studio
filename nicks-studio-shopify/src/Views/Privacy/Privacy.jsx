import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Privacy.css';

const Privacy = () => {
  const lastUpdated = "January 1, 2025";

  return (
    <>
      <Helmet>
        <title>Privacy Policy - Nickola Magnolia</title>
        <meta name="description" content="Privacy Policy for Nickola Magnolia's official website. Learn how we protect your personal information." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <div className="privacy-container">
        <div className="privacy-content">
          <header className="privacy-header">
            <h1>Privacy Policy</h1>
            <p className="privacy-last-updated">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="privacy-sections">
            <section className="privacy-section">
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you:
              </p>
              <ul>
                <li>Subscribe to our newsletter</li>
                <li>Make a purchase from our online store</li>
                <li>Contact us through our website</li>
                <li>Interact with our social media accounts</li>
              </ul>
              <p>
                This information may include your name, email address, mailing address, 
                phone number, and payment information.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process transactions and send you related information</li>
                <li>Send you newsletters and marketing communications</li>
                <li>Respond to your comments and questions</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information 
                to third parties without your consent, except as described in this policy:
              </p>
              <ul>
                <li>Service providers who assist us in operating our website</li>
                <li>Payment processors for transaction processing</li>
                <li>Email service providers for newsletter delivery</li>
                <li>Legal requirements or to protect our rights</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or 
                destruction. However, no method of transmission over the internet 
                is 100% secure.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Cookies and Tracking</h2>
              <p>
                Our website uses cookies to enhance your experience. Cookies are 
                small files stored on your device that help us:
              </p>
              <ul>
                <li>Remember your preferences</li>
                <li>Analyze website traffic and usage</li>
                <li>Provide personalized content</li>
                <li>Improve our services</li>
              </ul>
              <p>
                You can control cookies through your browser settings, but disabling 
                cookies may affect website functionality.
              </p>
            </section>

            <section className="privacy-section">
              <h2>6. Third-Party Services</h2>
              <p>
                Our website may contain links to third-party services, including:
              </p>
              <ul>
                <li>Spotify for music streaming</li>
                <li>YouTube for video content</li>
                <li>Instagram for social media</li>
                <li>Shopify for e-commerce</li>
              </ul>
              <p>
                These services have their own privacy policies, and we are not 
                responsible for their practices.
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
                <li>Request data portability</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information 
                provided below.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Children's Privacy</h2>
              <p>
                Our website is not intended for children under 13 years of age. 
                We do not knowingly collect personal information from children 
                under 13. If you believe we have collected such information, 
                please contact us immediately.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will 
                notify you of any changes by posting the new policy on this page 
                and updating the "Last updated" date.
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy, please contact us:
              </p>
              <div className="privacy-contact">
                <p>
                  <strong>Email:</strong> <a href="mailto:privacy@nickolamagnolia.com">privacy@nickolamagnolia.com</a>
                </p>
                <p>
                  <strong>Mail:</strong> Nickola Magnolia Privacy Team<br />
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
