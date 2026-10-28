import { useState, type AnimationEvent, type ReactElement } from 'react';
import styles from './mobile-navigation.module.scss';

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
  const openLabel = 'Close Menu';
  const closedLabel = 'Open Menu';

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  /**
   * Opens the drawer, or starts the close animation when it is already open.
   *
   * @returns {void}
   */
  const toggleOpen = (): void => {
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
        onClick={toggleOpen}
        aria-expanded={open}
      >
        {open ? openLabel : closedLabel}
      </button>

      <div
        className={backdropClassName}
        onClick={toggleOpen}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden={!open && !closing}
      />

      <div
        className={drawerClassName}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden={!open && !closing}
      />
    </>
  );
}
