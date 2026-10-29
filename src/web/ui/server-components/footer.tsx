import React from 'react';

/**
 * Footer component for the website.
 *
 * This component is used to render the footer for the website.
 * It contains the copyright information.
 *
 * @returns {React.ReactNode} The footer component.
 */
export default function Footer(): React.ReactNode {
  return (
    <footer className="site-footer">
      <div className="container p-4">
        <div className="row">
          <div className="col">
            <p className="mb-0 text-center">
              <small>©{new Date().getFullYear()} bed.dev</small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
