/**
 * Returns the SVG markup for the X Large icon.
 *
 * @returns {React.ReactNode} The SVG markup for the X Large icon.
 */
function xLg(): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-x-lg"
      viewBox="0 0 16 16"
    >
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
    </svg>
  );
}

/**
 * Returns the SVG markup for the List icon.
 *
 * @returns {React.ReactNode} The SVG markup for the List icon.
 */
function List(): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-list"
      viewBox="0 0 16 16"
    >
      <path
        fill-rule="evenodd"
        d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
      />
    </svg>
  );
}

/**
 * A record of all the icons available.
 *
 * @type {Record<string, () => React.ReactNode>}
 */
const icons: Record<string, () => React.ReactNode> = {
  'x-lg': xLg,
  list: List,
};

/**
 * Returns the SVG markup for the given icon name.
 *
 * @param {string} name - The name of the icon to return.
 * @returns {React.ReactNode} The SVG markup for the given icon name.
 */
export default function Icon({ name }: { name: string }): React.ReactNode {
  if (!icons[name]) {
    return null;
  }

  return icons[name]();
}
