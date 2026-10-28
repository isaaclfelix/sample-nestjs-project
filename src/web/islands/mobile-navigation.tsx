import { useState, type AnimationEvent, type ReactElement } from 'react';
import styles from './mobile-navigation.module.scss';
import Icon from '../shared/icon.js';

/**
 * Interactive mobile-navigation island.
 *
 * Toggles a left offcanvas drawer and backdrop with CSS keyframe enter/exit
 * animations. Close uses a short-lived `closing` class so exit animations are
 * not applied on the initial closed mount.
 *
 * @returns {ReactElement} Interactive island markup.
 */
export default function MobileNavigation(): ReactElement {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  /**
   * Opens the drawer, or starts the close animation when it is already open.
   *
   * @returns {void}
   */
  const toggleDrawer = (): void => {
    if (open) {
      // Drop `.open` and run exit keyframes via `.closing`.
      setOpen(false);
      setClosing(true);
      return;
    }

    setClosing(false);
    setOpen(true);
  };

  /**
   * Clears the closing class after exit animations finish so base closed
   * styles take over without a flash.
   *
   * @param {AnimationEvent<HTMLDivElement>} event - The animation end event.
   * @returns {void}
   */
  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
    // Only the element's own animations (not bubbling children) clear closing.
    if (event.target !== event.currentTarget) {
      return;
    }

    if (closing) {
      setClosing(false);
    }
  };

  const backdropClassName = [
    styles.navigationDrawerBackdrop,
    open ? styles.open : '',
    closing ? styles.closing : '',
    'd-md-none',
  ]
    .filter(Boolean)
    .join(' ');

  const drawerClassName = [
    styles.navigationDrawer,
    open ? styles.open : '',
    closing ? styles.closing : '',
    'd-md-none',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        type="button"
        className="navigation-burger-button d-md-none btn btn-light btn-sm"
        onClick={toggleDrawer}
        aria-expanded={open}
      >
        {open ? <Icon name="x-lg" /> : <Icon name="list" />}
      </button>

      <div
        className={backdropClassName}
        onClick={toggleDrawer}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden={!open && !closing}
      />

      <div
        className={drawerClassName}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden={!open && !closing}
      >
        <div className={`${styles.navigationDrawerHeader} d-flex`}>
          <h5 className="display-6 mb-0">Navigation</h5>
          <button
            className={`${styles.navigationDrawerCloseButton} btn btn-light btn-sm`}
            onClick={toggleDrawer}
          >
            <Icon name="x-lg" />
          </button>
        </div>

        <div className={styles.navigationDrawerContent}>
          <ul className="list-unstyled mb-0">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/api/docs">Swagger Docs</a>
            </li>
          </ul>
        </div>

        <div className={styles.navigationDrawerFooter}>
          <ul className="list-unstyled mb-0">
            <li>
              <a href="/login">Login</a>
            </li>
            <li>
              <a href="/register">Register</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
