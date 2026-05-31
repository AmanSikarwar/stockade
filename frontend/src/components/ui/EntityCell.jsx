import { Icon } from "../icons/Icon";
import { Avatar } from "./Avatar";

export function ProductCell({ name, sku, icon = "box" }) {
  return (
    <div className="product-cell">
      <span className="thumb">
        <Icon name={icon} size={16} stroke={1.9} />
      </span>
      <div className="identity">
        <div className="meta">
          <div className="name">{name}</div>
          {sku ? <div className="sub t-num">{sku}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PersonCell({ name, sub, size = 34 }) {
  return (
    <div className="identity">
      <Avatar name={name} size={size} />
      <div className="meta">
        <div className="name">{name}</div>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
    </div>
  );
}
