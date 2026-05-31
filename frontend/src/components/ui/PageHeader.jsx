import { Link } from "react-router";

import { Icon } from "../icons/Icon";

export function PageHeader({ actions, title, subtitle, children, backTo, backLabel }) {
  return (
    <header className="page-head">
      <div>
        {backTo ? (
          <Link className="crumb" to={backTo}>
            <Icon name="chevron" size={14} stroke={2} className="flip-x" />
            <span className="t-caption">{backLabel ?? "Back"}</span>
          </Link>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p className="sub t-body">{subtitle}</p> : null}
        {children ? <div className="sub t-body">{children}</div> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}
