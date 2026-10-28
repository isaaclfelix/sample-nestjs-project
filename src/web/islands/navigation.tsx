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
    <nav>
      <div className="container">
        <div className="row">
          <div className="col">
            <ul className={`${styles.navigationList} list-unstyled d-flex`}>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/api/docs">Swagger Docs</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
