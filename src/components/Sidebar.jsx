import { NavLink, Link } from "react-router-dom";
import { Avatar }        from "./ui/Avatar";
import { Ic }            from "./ui/Icons";
import { NAV_MAIN, NAV_GENERAL, SIDEBAR_META } from "../data/mockData";
import { useStore }      from "../store/useStore";

export function Sidebar() {
  const user = useStore((state) => state.user);
  const folders = useStore((state) => state.folders);

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <Link to="/" className="sidebar-logo sidebar-logo--link">
        <div className="sidebar-logo-icon">{SIDEBAR_META.logoMark}</div>
        <div>
          <div className="sidebar-logo-name">{SIDEBAR_META.logoName}</div>
          <div className="sidebar-logo-sub">{SIDEBAR_META.logoSub}</div>
        </div>
      </Link>

      {/* ── Nav ── */}
      <div className="sidebar-nav">
        <div className="nav-section">{SIDEBAR_META.navMain}</div>
        {NAV_MAIN.map(n => <NavItem key={n.id} item={n} />)}

        <div className="nav-divider" />

        <div className="nav-section">{SIDEBAR_META.navGeneral}</div>
        {NAV_GENERAL.map(n => <NavItem key={n.id} item={n} />)}
      </div>

      {/* ── Files Tree ── */}
      <div className="sidebar-files">
        <div className="sidebar-files-header">
          <div className="sidebar-files-label">{SIDEBAR_META.myFiles}</div>
          <Link to="/studyfiles" className="sidebar-files-add">
            <Ic n="plus" s={14} />
          </Link>
        </div>

        {folders.slice(0, 5).map(f => (
          <Link to="/studyfiles" key={f.id} className="file-row file-row--link">
            <Ic n="folder" s={14} c="currentColor" />
            <span>{f.name}</span>
            {f.files > 0 && <div className="file-row-count">{f.files}</div>}
          </Link>
        ))}

        <Link to="/studyfiles" className="file-row-see-all file-row-see-all--link">
          {SIDEBAR_META.seeAll}
        </Link>
      </div>

      {/* ── User ── */}
      <div className="sidebar-user">
        <Avatar letter={user?.avatar || "N"} size={32} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="sidebar-user-sub">Level {user?.level}</div>
        </div>
      </div>

    </aside>
  );
}

function NavItem({ item }) {
  return (
    <NavLink
      to={`/${item.id}`}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""} nav-item--link`}
    >
      {() => (
        <>
          <Ic n={item.icon} s={16} c="currentColor" />
          {item.label}
        </>
      )}
    </NavLink>
  );
}