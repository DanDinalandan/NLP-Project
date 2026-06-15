import { useEffect, useState } from "react";
import { Avatar }    from "../components/ui/Avatar.jsx";
import { Btn }       from "../components/ui/Btn.jsx";
import { Card }      from "../components/ui/Card.jsx";
import { FormInput } from "../components/ui/FormInput.jsx";
import { Ic }        from "../components/ui/Icons.jsx";
import { SLabel }    from "../components/ui/SLabel.jsx";
import { Toggle }    from "../components/ui/Toggle.jsx";
import { Badge }     from "../components/ui/Badge.jsx";
import { settingsApi } from "../api/settings.js";
import { useStore }    from "../store/useStore.js";

function fmtBytes(b) {
  if (!b) return '0 B';
  if (b < 1024)        return `${b} B`;
  if (b < 1024 ** 2)   return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3)   return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

export function Settings() {
  const theme         = useStore(s => s.theme);
  const setTheme      = useStore(s => s.setTheme);
  const storeUser     = useStore(s => s.user);
  const saveProfile   = useStore(s => s.saveUserProfile);

  // Profile form — initialised from store user
  const [fullName,   setFullName]  = useState(`${storeUser?.firstName ?? ''} ${storeUser?.lastName ?? ''}`.trim());
  const [avatarLet,  setAvatarLet] = useState(storeUser?.avatar ?? '');
  const [profileMsg, setProfileMsg]= useState('');
  const [profileBusy,setPBusy]     = useState(false);

  // Ollama / storage
  const [ollama,  setOllama]  = useState(null);
  const [storage, setStorage] = useState(null);

  // Supabase auth
  const [authUser,    setAuthUser]    = useState(null);
  const [loginEmail,  setLoginEmail]  = useState('');
  const [loginPw,     setLoginPw]     = useState('');
  const [authErr,     setAuthErr]     = useState('');
  const [authBusy,    setAuthBusy]    = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);

  // Data actions
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    settingsApi.getOllamaStatus().then(setOllama).catch(() => {});
    settingsApi.getStorage().then(setStorage).catch(() => {});
    settingsApi.getSettings().then(s => {
      if (s.supabase_user) setAuthUser(s.supabase_user);
      // Sync profile fields from backend if not already set locally
      if (s.user_name)   setFullName(s.user_name);
      if (s.user_avatar) setAvatarLet(s.user_avatar);
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setPBusy(true);
    setProfileMsg('');
    try {
      await saveProfile(fullName.trim(), avatarLet.trim() || fullName[0]?.toUpperCase() || 'U');
      setProfileMsg('Saved!');
      setTimeout(() => setProfileMsg(''), 2500);
    } catch { setProfileMsg('Save failed.'); }
    finally  { setPBusy(false); }
  };

  const handleLogin = async () => {
    setAuthErr(''); setAuthBusy(true);
    try {
      const res = await settingsApi.login(loginEmail, loginPw);
      setAuthUser(res);
      setLoginEmail(''); setLoginPw('');
      useStore.getState().setSupabaseUser(res);
    } catch (e) { setAuthErr(e.message); }
    finally     { setAuthBusy(false); }
  };

  const handleLogout = async () => {
    await settingsApi.logout().catch(() => {});
    setAuthUser(null);
    useStore.getState().setSupabaseUser(null);
  };

  const handleClear = async () => {
    if (!confirm('Delete all local folders, files, and generated outputs?')) return;
    setClearing(true);
    try { await settingsApi.clearData(); setStorage(null); }
    finally { setClearing(false); }
  };

  const handleExport = async () => {
    try {
      const data = await settingsApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `reviewbot-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Export failed. Make sure the backend is running.'); }
  };

  const avatarSeed = fullName.trim().replace(/\s+/g, '') || 'user';
  const displayEmail  = authUser?.email || storeUser?.email || '';

  return (
    <>
      {/* ── Profile ──────────────────────────────────────────── */}
      <SLabel className="gap-12">Profile</SLabel>
      <Card className="gap-20">
        <div className="settings-account-card">
          <Avatar seed={avatarSeed} size={64} />
          <div className="settings-meta">
            <div className="settings-name">{fullName || 'No name set'}</div>
            <div className="settings-email">
              {displayEmail || 'No email'} · Lv.{storeUser?.level ?? 1}
            </div>
            <div className="settings-email" style={{ marginTop: 2 }}>
              🔥 {storeUser?.streak ?? 0}-day streak
            </div>
          </div>
        </div>

        <div className="fields-grid" style={{ marginTop: 8 }}>
          <FormInput
            label="Display name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. Juan dela Cruz"
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: -4 }}>
          Your avatar is auto-generated from your name — no upload needed.
        </div>
        <div className="save-row">
          <Btn variant="primary" size="sm" onClick={handleSaveProfile} disabled={profileBusy}>
            {profileBusy ? 'Saving…' : 'Save profile'}
          </Btn>
          {profileMsg && (
            <span style={{ fontSize: 12, color: profileMsg === 'Saved!' ? 'var(--success)' : 'var(--danger)', marginLeft: 10 }}>
              {profileMsg}
            </span>
          )}
        </div>
      </Card>

      {/* ── AI Engine ─────────────────────────────────────────── */}
      <SLabel className="gap-12">AI Engine (Ollama)</SLabel>
      <Card className="gap-16">
        {ollama ? (
          <div className="sec-row">
            <div>
              <div className="sec-row-label">
                <Ic n={ollama.running ? 'check' : 'x'} s={14}
                  c={ollama.running ? 'var(--success)' : 'var(--danger)'} />
                {ollama.running ? ' Ollama running' : ' Ollama not detected'}
              </div>
              {ollama.recommended_model && (
                <div className="sec-row-sub">Recommended: {ollama.recommended_model} · {ollama.ram_gb} GB RAM</div>
              )}
              {ollama.models?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {ollama.models.map(m => (
                    <Badge key={m} bg="rgba(140,152,228,.14)" cl="#6b77cc">{m}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="sec-row-sub">Checking Ollama status…</div>
        )}
      </Card>

      {/* ── Appearance ─────────────────────────────────────────── */}
      <SLabel className="gap-12">Appearance</SLabel>
      <Card className="gap-20">
        <div className="sec-row">
          <div>
            <div className="sec-row-label"><Ic n="sparkles" s={14} c="var(--blue)" /> Dark mode</div>
            <div className="sec-row-sub">Switch between light and dark interface</div>
          </div>
          <Toggle checked={theme === 'dark'} onChange={e => setTheme(e.target.checked ? 'dark' : 'light')} />
        </div>
      </Card>

      {/* ── Online Account ─────────────────────────────────────── */}
      <SLabel className="gap-12">Online Account (optional — for public sharing)</SLabel>
      <Card className="gap-20">
        {authUser ? (
          <>
            <div className="sec-row">
              <div>
                <div className="sec-row-label"><Ic n="check" s={14} c="var(--success)" /> Signed in</div>
                <div className="sec-row-sub">{authUser.email}</div>
              </div>
              <Btn variant="secondary" size="sm" onClick={handleLogout}>Sign out</Btn>
            </div>
            <div className="sec-row-sub" style={{ marginTop: 4 }}>
              You can now make folders public and share your reviewers with others.
            </div>
          </>
        ) : (
          <>
            <div className="sec-row-sub">
              Sign in to search and share public reviewers. Works with any email — signing in
              also creates a free account if one doesn&apos;t exist.
            </div>
            <div className="fields-grid">
              <FormInput label="Email" value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)} type="email" />
              <FormInput label="Password" value={loginPw}
                onChange={e => setLoginPw(e.target.value)} type="password" />
            </div>
            {authErr && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{authErr}</div>}
            <div className="save-row">
              <Btn variant="primary" size="sm" onClick={handleLogin}
                disabled={authBusy || !loginEmail || !loginPw}>
                {authBusy ? 'Signing in…' : 'Sign in / Create account'}
              </Btn>
            </div>
          </>
        )}
      </Card>

      {/* ── Storage ────────────────────────────────────────────── */}
      <SLabel className="gap-12">Storage</SLabel>
      <Card className="gap-16">
        {storage ? (
          <>
            <div className="sec-row-sub">Database: {fmtBytes(storage.db_size_bytes)}</div>
            <div className="sec-row-sub">Outputs: {fmtBytes(storage.outputs_size_bytes)}</div>
            <div className="sec-row-sub">Embeddings: {fmtBytes(storage.chroma_size_bytes)}</div>
            <div className="sec-row-sub" style={{ fontWeight: 600 }}>
              Total: {fmtBytes(storage.total_bytes)}
            </div>
          </>
        ) : (
          <div className="sec-row-sub">Loading storage info…</div>
        )}
        <div className="settings-actions" style={{ gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={handleExport}>
            <Ic n="download" s={13} /> Export all data
          </Btn>
          <Btn variant="danger" size="sm" onClick={handleClear} disabled={clearing}>
            {clearing ? 'Clearing…' : 'Clear all local data'}
          </Btn>
        </div>
      </Card>
    </>
  );
}
