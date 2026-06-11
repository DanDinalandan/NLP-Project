import { useState } from "react";
import { Avatar }  from "./ui/Avatar.jsx";
import { Ic }      from "./ui/Icons.jsx";
import { USER, TOPBAR } from "../data/mockData.js";

export function Topbar({ setPage }) {
  const [q, setQ] = useState("");

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <Ic n="search" s={14} c="var(--muted)" />
        <input
          placeholder={TOPBAR.placeholder}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {/* Right cluster */}
      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label={TOPBAR.notifLabel}>
          <Ic n="bell" s={15} />
          <span className="notif-dot" />
        </button>
        <Avatar
          letter={USER.avatar}
          size={34}
          onClick={() => setPage("settings")}
        />
      </div>
    </header>
  );
}