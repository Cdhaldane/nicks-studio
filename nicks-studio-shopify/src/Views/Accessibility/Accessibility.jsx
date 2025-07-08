import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Accessibility.css';

const Accessibility = () => {
  const lastUpdated = "January 1, 2025";

  return (
    <>
      <Helmet>
        <title>Accessibility Statement - Nickola Magnolia</title>
        <meta name="description" content="Accessibility statement for Nickola Magnolia's official website. Learn about our commitment to digital accessibility." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <div className="accessibility-container">
        <div className="accessibility-content">
          <header className="accessibility-header">
            <h1>Accessibility Statement</h1>
            <p className="accessibility-last-updated">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="accessibility-sections">
            <section className="accessibility-section">
              <h2>Our Commitment to Accessibility</h2>
              <p>
                Nickola Magnolia is committed to ensuring digital accessibility for people with disabilities. 
                We are continually improving the user experience for everyone and applying the relevant 
                accessibility standards.
              </p>
              <p>
                We believe that everyone should have equal access to information and functionality, 
                regardless of their abilities or disabilities.
              </p>
            </section>

            <section className="accessibility-section">
              <h2>Accessibility Standards</h2>
              <p>
                This website strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
                Level AA standards. These guidelines explain how to make web content more accessible to 
                people with disabilities.
              </p>
              <p>
                We aim to meet or exceed these standards in all areas of our website, including:
              </p>
              <ul>
                <li>Perceivable - Information must be presentable in ways users can perceive</li>
                <li>Operable - Interface components must be operable by all users</li>
                <li>Understandable - Information and UI operation must be understandable</li>
                <li>Robust - Content must be robust enough for various assistive technologies</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Accessibility Features</h2>
              <p>
                Our website includes several accessibility features to enhance your experience:
              </p>
              <ul>
                <li><strong>Keyboard Navigation:</strong> All interactive elements can be accessed using a keyboard</li>
                <li><strong>Screen Reader Support:</strong> Proper heading structure and ARIA labels for screen readers</li>
                <li><strong>High Contrast:</strong> Support for high contrast mode and color preferences</li>
                <li><strong>Responsive Design:</strong> Content adapts to different screen sizes and zoom levels</li>
                <li><strong>Alternative Text:</strong> Descriptive alt text for images</li>
                <li><strong>Focus Indicators:</strong> Clear visual focus indicators for keyboard navigation</li>
                <li><strong>Consistent Navigation:</strong> Predictable and consistent navigation throughout the site</li>
                <li><strong>Readable Fonts:</strong> Clear, legible typography with sufficient contrast</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Browser and Assistive Technology Support</h2>
              <p>
                This website is designed to work with the following assistive technologies:
              </p>
              <ul>
                <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                <li>Voice recognition software</li>
                <li>Keyboard-only navigation</li>
                <li>Screen magnification software</li>
                <li>High contrast display modes</li>
              </ul>
              <p>
                We recommend using the latest versions of modern browsers for the best experience:
              </p>
              <ul>
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Safari</li>
                <li>Microsoft Edge</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Known Limitations</h2>
              <p>
                While we strive for full accessibility, we acknowledge that some limitations may exist:
              </p>
              <ul>
                <li>Third-party embedded content (videos, social media) may not be fully accessible</li>
                <li>Some older PDF documents may not be fully accessible</li>
                <li>Live audio content may not have real-time captions</li>
              </ul>
              <p>
                We are actively working to address these limitations and improve accessibility across all content.
              </p>
            </section>

            <section className="accessibility-section">
              <h2>Accessibility Testing</h2>
              <p>
                We regularly test our website using various methods:
              </p>
              <ul>
                <li>Automated accessibility testing tools</li>
                <li>Manual testing with keyboard navigation</li>
                <li>Screen reader testing</li>
                <li>Color contrast analysis</li>
                <li>Mobile device testing</li>
                <li>User testing with people with disabilities</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Accessibility Tips</h2>
              <p>
                Here are some tips to improve your browsing experience:
              </p>
              <ul>
                <li><strong>Keyboard Navigation:</strong> Use Tab to move forward, Shift+Tab to move backward</li>
                <li><strong>Skip Links:</strong> Use the "Skip to content" link to bypass navigation</li>
                <li><strong>Zoom:</strong> Use Ctrl/Cmd + Plus to zoom in, Ctrl/Cmd + Minus to zoom out</li>
                <li><strong>High Contrast:</strong> Enable high contrast mode in your operating system</li>
                <li><strong>Text Size:</strong> Adjust text size in your browser settings</li>
                <li><strong>Voice Control:</strong> Use voice commands if available on your device</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Third-Party Content</h2>
              <p>
                Our website includes content from third-party services such as:
              </p>
              <ul>
                <li>Spotify for music streaming</li>
                <li>YouTube for video content</li>
                <li>Social media platforms</li>
                <li>Payment processors</li>
              </ul>
              <p>
                While we cannot control the accessibility of third-party content, we encourage these 
                services to follow accessibility best practices and will work with them to improve 
                accessibility where possible.
              </p>
            </section>

            <section className="accessibility-section">
              <h2>Feedback and Contact</h2>
              <p>
                We welcome your feedback on the accessibility of our website. If you encounter any 
                accessibility barriers or have suggestions for improvement, please contact us:
              </p>
              <div className="accessibility-contact">
                <p>
                  <strong>Email:</strong> <a href="mailto:accessibility@nickolamagnolia.com">accessibility@nickolamagnolia.com</a>
                </p>
                <p>
                  <strong>Phone:</strong> <a href="tel:+1-555-123-4567">+1 (555) 123-4567</a>
                </p>
                <p>
                  <strong>Mail:</strong> Nickola Magnolia Accessibility Team<br />
                </p>
              </div>
              <p>
                When reporting accessibility issues, please include:
              </p>
              <ul>
                <li>The page URL where you encountered the issue</li>
                <li>A description of the problem</li>
                <li>The browser and assistive technology you're using</li>
                <li>Any error messages you received</li>
              </ul>
            </section>

            <section className="accessibility-section">
              <h2>Continuous Improvement</h2>
              <p>
                Accessibility is an ongoing effort. We are committed to:
              </p>
              <ul>
                <li>Regularly auditing our website for accessibility</li>
                <li>Training our team on accessibility best practices</li>
                <li>Incorporating accessibility into our design and development process</li>
                <li>Staying updated on accessibility standards and guidelines</li>
                <li>Responding to user feedback and making necessary improvements</li>
              </ul>
              <p>
                We will continue to update this statement as we make improvements to our website.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Accessibility;
