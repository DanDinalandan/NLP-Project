import { NavLink, Link } from "react-router-dom";
import { Avatar }          from "./ui/Avatar";
import { Ic }              from "./ui/Icons";
import { ReviewBotLogo }   from "./ui/ReviewBotLogo.jsx";
import { NAV_MAIN, NAV_GENERAL, SIDEBAR_META } from "../data/mockData";
import { useStore }        from "../store/useStore";
import { getLevelTitle }   from "../data/gamification";

export function Sidebar() {
  const user = useStore((state) => state.user);

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <Link to="/" className="sidebar-logo sidebar-logo--link">
        <ReviewBotLogo size={38} />
        <div>
          <div className="sidebar-logo-name">ReviewBot</div>
          <div className="sidebar-logo-sub">AI Study Assistant</div>
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

      {/* ── User ── */}
      <div className="sidebar-user">
        <Avatar seed={`${user?.firstName}${user?.lastName}`} size={32} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="sidebar-user-sub">
            Lv.{user?.level} · {getLevelTitle(user?.level ?? 1)}
          </div>
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
