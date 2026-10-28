import styles from './navigation.module.scss';

/**
 * Navigation component for the application.
 *
 * This component is used to render the navigation for the application.
 *
 * @returns {React.ReactNode} The navigation component.
 */
export default function Navigation(): React.ReactNode {
  return (
    <nav className={styles.navigationWrapper}>
      <div className={`${styles.navigationContainer} container`}>
        <div className={`${styles.navigationRow} row`}>
          <div className={`${styles.navigationLogo} col display-6`}>
            <a href="/" className={styles.navigationLogoLink}>
              bed.dev
            </a>
          </div>
          <div className={`${styles.navigationSeparator} col`} />
          <div className="col">
            <ul className={`${styles.navigationList} list-unstyled d-flex`}>
              <li>
                <a href="/" className={styles.navigationLink}>
                  Home
                </a>
              </li>
              <li>
                <a href="/api/docs" className={styles.navigationLink}>
                  Swagger Docs
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
