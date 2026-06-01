/* aallms — UI kit · components (composed, some interactive) */

function UICard({ eyebrow, title, children, hover }) {
  return (
    <div className={"ui-card" + (hover ? " ui-card--hover" : "")}>
      {eyebrow ? <span className="ui-card__eyebrow">{eyebrow}</span> : null}
      {title ? <h3 className="ui-card__title">{title}</h3> : null}
      <p className="ui-card__body">{children}</p>
    </div>
  );
}

function Callout({ variant = "note", icon = "info", title, children }) {
  return (
    <div className={"callout callout--" + variant}>
      <span className="callout__icon"><Icon name={icon} size={18} stroke={2} /></span>
      <div>
        {title ? <p className="callout__title">{title}</p> : null}
        <p className="callout__body">{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ name = "attention.py" }) {
  return (
    <div className="codeblock">
      <div className="codeblock__bar">
        <span className="codeblock__dot" style={{ background: "#E8492A" }} />
        <span className="codeblock__dot" style={{ background: "#E0992E" }} />
        <span className="codeblock__dot" style={{ background: "#1F9E8C" }} />
        <span className="codeblock__name">{name}</span>
      </div>
      <pre className="codeblock__body"><span className="tok-com"># scaled dot-product attention</span>{"\n"}
<span className="tok-kw">def</span> <span className="tok-fn">attend</span>(q, k, v):{"\n"}
{"    "}scores = q @ k.T / <span className="tok-fn">sqrt</span>(d_k){"\n"}
{"    "}w = <span className="tok-fn">softmax</span>(scores){"\n"}
{"    "}<span className="tok-kw">return</span> w @ v  <span className="tok-com"># [seq, d_v]</span></pre>
    </div>
  );
}

function Tabs({ tabs }) {
  const [i, setI] = React.useState(0);
  return (
    <div>
      <div className="tabs">
        {tabs.map((t, n) => (
          <button key={n} className={"tab" + (n === i ? " is-active" : "")} onClick={() => setI(n)}>{t.label}</button>
        ))}
      </div>
      <div className="tabpanel">{tabs[i].body}</div>
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div className="accordion">
      {items.map((it, n) => (
        <div key={n} className={"acc-item" + (open === n ? " is-open" : "")}>
          <button className="acc-head" onClick={() => setOpen(open === n ? -1 : n)}>
            {it.q}
            <span className="acc-chev"><Icon name="chevron-right" size={18} stroke={2} /></span>
          </button>
          <div className="acc-body"><div className="acc-body-inner">{it.a}</div></div>
        </div>
      ))}
    </div>
  );
}

function PullQuote({ children, cite }) {
  return <blockquote className="pullquote">{children}{cite ? <cite>{cite}</cite> : null}</blockquote>;
}

function Tooltip({ label, children }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="tip-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show ? <span className="tip-bubble">{label}</span> : null}
    </span>
  );
}

function DataTable({ cols, rows }) {
  return (
    <table className="table">
      <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

function StepDots({ total, current }) {
  return (
    <span className="stepdots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={"stepdot" + (i < current ? " is-done" : i === current ? " is-now" : "")} />
      ))}
    </span>
  );
}

Object.assign(window, { UICard, Callout, CodeBlock, Tabs, Accordion, PullQuote, Tooltip, DataTable, StepDots });
