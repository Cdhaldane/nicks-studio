import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Terms.css';

const Terms = () => {
  const lastUpdated = "January 1, 2025";

  return (
    <>
      <Helmet>
        <title>Terms of Service - Nickola Magnolia</title>
        <meta name="description" content="Terms of Service for Nickola Magnolia's official website. Review our terms and conditions." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <div className="terms-container">
        <div className="terms-content">
          <header className="terms-header">
            <h1>Terms of Service</h1>
            <p className="terms-last-updated">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="terms-sections">
            <section className="terms-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using this website, you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the 
                above, please do not use this service.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials on 
                Nickola Magnolia's website for personal, non-commercial transitory viewing only. 
                This is the grant of a license, not a transfer of title, and under this license 
                you may not:
              </p>
              <ul>
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
              <p>
                This license shall automatically terminate if you violate any of these restrictions 
                and may be terminated by Nickola Magnolia at any time.
              </p>
            </section>

            <section className="terms-section">
              <h2>3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, 
                complete, and current at all times. You are responsible for safeguarding the 
                password and for all activities that occur under your account.
              </p>
              <p>
                You agree not to disclose your password to any third party. You must notify us 
                immediately upon becoming aware of any breach of security or unauthorized use 
                of your account.
              </p>
            </section>

            <section className="terms-section">
              <h2>4. Purchases and Payment</h2>
              <p>
                All purchases made through our website are subject to product availability. 
                We reserve the right to discontinue any product at any time.
              </p>
              <p>
                Payment must be received by us before your order is dispatched. We accept 
                various forms of payment as indicated on our website.
              </p>
              <p>
                All prices are subject to change without notice. We are not responsible for 
                any errors in pricing.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Shipping and Returns</h2>
              <p>
                We will make every effort to ship your order within the timeframe indicated 
                on our website. However, we are not responsible for delays due to circumstances 
                beyond our control.
              </p>
              <p>
                Returns and exchanges are subject to our return policy. Items must be returned 
                in their original condition within 30 days of purchase.
              </p>
            </section>

            <section className="terms-section">
              <h2>6. Intellectual Property</h2>
              <p>
                All content on this website, including but not limited to text, graphics, logos, 
                images, audio clips, and software, is the property of Nickola Magnolia or its 
                content suppliers and is protected by copyright and other intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, create derivative works of, publicly 
                display, or publicly perform any copyrighted material without our prior written consent.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. User-Generated Content</h2>
              <p>
                Our website may allow you to post, link, store, share and otherwise make available 
                certain information, text, graphics, videos, or other material. You are responsible 
                for the content you post.
              </p>
              <p>
                By posting content, you grant us a non-exclusive, royalty-free, worldwide license 
                to use, modify, publicly perform, publicly display, reproduce, and distribute such content.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. Prohibited Uses</h2>
              <p>You may not use our website:</p>
              <ul>
                <li>For any unlawful purpose or to solicit others to commit unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>9. Disclaimer</h2>
              <p>
                The materials on Nickola Magnolia's website are provided on an 'as is' basis. 
                Nickola Magnolia makes no warranties, expressed or implied, and hereby disclaims 
                and negates all other warranties including without limitation, implied warranties 
                or conditions of merchantability, fitness for a particular purpose, or 
                non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="terms-section">
              <h2>10. Limitations</h2>
              <p>
                In no event shall Nickola Magnolia or its suppliers be liable for any damages 
                (including, without limitation, damages for loss of data or profit, or due to 
                business interruption) arising out of the use or inability to use the materials 
                on Nickola Magnolia's website, even if Nickola Magnolia or an authorized 
                representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="terms-section">
              <h2>11. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the 
                laws of [Your State/Province] and you irrevocably submit to the exclusive 
                jurisdiction of the courts in that state or location.
              </p>
            </section>

            <section className="terms-section">
              <h2>12. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these terms 
                at any time. If a revision is material, we will try to provide at least 30 days 
                notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="terms-section">
              <h2>13. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="terms-contact">
                <p>
                  <strong>Email:</strong> <a href="mailto:legal@nickolamagnolia.com">legal@nickolamagnolia.com</a>
                </p>
                <p>
                  <strong>Mail:</strong> Nickola Magnolia Legal Team<br />
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
