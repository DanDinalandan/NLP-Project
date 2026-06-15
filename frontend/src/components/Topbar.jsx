import { useNavigate } from "react-router-dom";
import { Avatar }  from "./ui/Avatar.jsx";
import { useStore } from "../store/useStore.js";

export function Topbar() {
  const navigate   = useNavigate();
  const user       = useStore(s => s.user);
  const avatarSeed = `${user?.firstName ?? ''}${user?.lastName ?? ''}` || 'user';

  return (
    <header className="topbar">
      <div className="topbar-right">
        <Avatar seed={avatarSeed} size={34} onClick={() => navigate("/settings")} />
      </div>
    </header>
  );
}
