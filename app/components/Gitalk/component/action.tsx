const Action = ({ className, onClick, text }) => (
  <a className={`gt-action ${className}`} onClick={onClick}>
    <span className="gt-action-text">{text}</span>
  </a>
);

export default Action;
