/* aallms — UI kit · atoms (React wrappers over kit.css classes) */

function Btn({ variant = "primary", size, block, icon, iconRight, children, ...p }) {
  const cls = ["btn", "btn--" + variant, size ? "btn--" + size : "", block ? "btn--block" : ""].join(" ").trim();
  return (
    <button className={cls} {...p}>
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} stroke={2.1} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 14 : 16} stroke={2.1} /> : null}
    </button>
  );
}
function IconBtn({ name, size = 18, ...p }) {
  return <button className="icon-btn" {...p}><Icon name={name} size={size} stroke={1.9} /></button>;
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
function Input(p) { return <input className="input" {...p} />; }
function Textarea(p) { return <textarea className="textarea" {...p} />; }
function Select({ children, ...p }) { return <select className="select" {...p}>{children}</select>; }

function Checkbox({ label, defaultChecked, ...p }) {
  return (
    <label className="choice">
      <input type="checkbox" defaultChecked={defaultChecked} {...p} />
      <span className="choice-box"><Icon name="check" size={12} stroke={3} /></span>
      {label}
    </label>
  );
}
function Radio({ label, name, defaultChecked, ...p }) {
  return (
    <label className="choice">
      <input type="radio" name={name} defaultChecked={defaultChecked} {...p} />
      <span className="choice-box choice-box--radio"><span className="choice-dot" /></span>
      {label}
    </label>
  );
}
function Switch({ label, checked, onChange, defaultChecked }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} defaultChecked={defaultChecked} />
      <span className="switch-track"><span className="switch-knob" /></span>
      {label}
    </label>
  );
}
function Range(p) { return <input type="range" className="range" {...p} />; }

function Chip({ active, removable, onRemove, children }) {
  return (
    <span className={"chip" + (active ? " chip--active" : "") + (removable ? " chip--removable" : "")}>
      {children}
      {removable ? <Icon name="x" size={13} stroke={2.4} /> : null}
    </span>
  );
}
function Badge({ variant = "neutral", icon, children }) {
  return <span className={"badge badge--" + variant}>{icon ? <Icon name={icon} size={11} stroke={2.4} /> : null}{children}</span>;
}
function TokChip({ kind, children }) { return <span className={"tokchip" + (kind ? " tokchip--" + kind : "")}>{children}</span>; }
function Tag({ children }) { return <span className="tag">{children}</span>; }

function Lnk({ children, ...p }) { return <a className="lnk" {...p}>{children}</a>; }
function InlineCode({ children }) { return <code className="code-inline">{children}</code>; }
function Kbd({ children }) { return <kbd className="kbd">{children}</kbd>; }

function Divider({ label }) {
  return label ? <div className="divider--label">{label}</div> : <hr className="divider" />;
}
function Progress({ value = 50 }) { return <div className="progress"><div className="progress-fill" style={{ width: value + "%" }} /></div>; }
function Spinner() { return <span className="spinner" />; }
function Avatar({ children }) { return <span className="avatar">{children}</span>; }

Object.assign(window, {
  Btn, IconBtn, Field, Input, Textarea, Select, Checkbox, Radio, Switch, Range,
  Chip, Badge, TokChip, Tag, Lnk, InlineCode, Kbd, Divider, Progress, Spinner, Avatar,
});
