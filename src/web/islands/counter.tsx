import { useState, type ReactElement } from 'react';
import styles from './counter.module.css';

/**
 * Renders a button that increments a count.
 *
 * Temporary demo island so hydration can be clicked in a browser. Remove
 * this component, its CSS module, its registry entry, and its use on the
 * home page under TD-009. Do not build product UI on it.
 *
 * @param {{ start: number }} props - Initial count from the server.
 * @returns {ReactElement} A button showing the current count.
 */
export default function Counter({ start }: { start: number }): ReactElement {
  const [count, setCount] = useState(start);

  return (
    // Sample module class so this island's CSS stays on its chunk. Remove with TD-009.
    <button
      type="button"
      className={styles.count}
      onClick={() => setCount((value) => value + 1)}
    >
      {/* TD-009: delete this demo island once a real one exists. */}
      {`Count: ${count}`}
    </button>
  );
}
