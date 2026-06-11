import { useEffect, useState } from "react";
import { Avatar }    from "../components/ui/Avatar.jsx";
import { Btn }       from "../components/ui/Btn.jsx";
import { Card }      from "../components/ui/Card.jsx";
import { FormInput } from "../components/ui/FormInput.jsx";
import { Ic }        from "../components/ui/Icons.jsx";
import { SLabel }    from "../components/ui/SLabel.jsx";
import { Toggle }    from "../components/ui/Toggle.jsx";
import { Badge }     from "../components/ui/Badge.jsx";
import { USER }      from "../data/mockData.js";
import { settingsApi } from "../api/settings.js";
import { useStore }  from "../store/useStore.js";

function fmtBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

export function Settings() {
  const theme    = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);
  const [twofa,  setTwofa]  = useState(true);
  const [first,  setFirst]  = useState(USER.firstName);
  const [last,   setLast]   = useState(USER.lastName);
  const [email,  setEmail]  = useState(USER.email);
  const [uname,  setUname]  = useState(USER.username);

  const [ollama,   setOllama]  = useState(null);
  const [storage,  setStorage] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw,    setLoginPw]    = useState('');
  const [authErr,    setAuthErr]    = useState('');
  const [authBusy,   setAuthBusy]   = useState(false);
  const [clearing,   setClearing]   = useState(false);

  useEffect(() => {
    settingsApi.getOllamaStatus().then(setOllama).catch(() => {});
    settingsApi.getStorage().then(setStorage).catch(() => {});
    settingsApi.getSettings().then(s => {
      if (s.supabase_user) setAuthUser(s.supabase_user);
    }).catch(() => {});
  }, []);

  const handleLogin = async () => {
    setAuthErr(''); setAuthBusy(true);
    try {
      const res = await settingsApi.login(loginEmail, loginPw);
      setAuthUser(res);
      setLoginEmail(''); setLoginPw('');
    } catch (e) {
      setAuthErr(e.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await settingsApi.logout().catch(() => {});
    setAuthUser(null);
  };

  const handleClear = async () => {
    if (!confirm('This will delete all local folders, files, and generated outputs. Continue?')) return;
    setClearing(true);
    try {
      await settingsApi.clearData();
      setStorage(null);
    } finally {
      setClearing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await settingsApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `reviewbot-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Export failed. Make sure the backend is running.'); }
  };

  return (
    <>
      {/* Ollama status */}
      <SLabel className="gap-12">AI Engine (Ollama)</SLabel>
      <Card className="gap-16">
        {ollama ? (
          <div className="sec-row">
            <div>
              <div className="sec-row-label">
                <Ic n={ollama.running ? 'check' : 'x'} s={14} c={ollama.running ? 'var(--success)' : 'var(--danger)'} />
                {ollama.running ? ' Ollama running' : ' Ollama not detected'}
              </div>
              {ollama.running && ollama.active_model && (
                <div className="sec-row-sub">Active model: {ollama.active_model}</div>
              )}
              {ollama.recommendation && (
                <div className="sec-row-sub">Recommended: {ollama.recommendation}</div>
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

      {/* Account card */}
      <SLabel className="gap-12">Account</SLabel>
      <Card className="gap-20">
        <div className="settings-account-card">
          <Avatar letter={USER.avatar} size={64} />
          <div className="settings-meta">
            <div className="settings-name">{USER.firstName} {USER.lastName}</div>
            <div className="settings-email">{USER.email} · Level {USER.level}</div>
            <div className="settings-actions">
              <Btn variant="secondary" size="sm">
                <Ic n="camera" s={13} /> Change photo
              </Btn>
              <Btn variant="secondary" size="sm">
                <Ic n="edit" s={13} /> Edit profile
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile details */}
      <SLabel className="gap-12">Profile Details</SLabel>
      <Card className="gap-20">
        <div className="fields-grid">
          <FormInput label="First name"     value={first}  onChange={e => setFirst(e.target.value)}  />
          <FormInput label="Last name"      value={last}   onChange={e => setLast(e.target.value)}   />
          <FormInput label="Email address"  value={email}  onChange={e => setEmail(e.target.value)} type="email" />
          <FormInput label="Username"       value={uname}  onChange={e => setUname(e.target.value)}  />
        </div>
        <div className="save-row">
          <Btn variant="primary" size="sm">Save changes</Btn>
        </div>
      </Card>

      {/* Appearance */}
      <SLabel className="gap-12">Appearance</SLabel>
      <Card className="gap-20">
        <div className="sec-row">
          <div>
            <div className="sec-row-label">
              <Ic n="sparkles" s={14} c="var(--blue)" /> Dark mode
            </div>
            <div className="sec-row-sub">Switch between light and dark interface</div>
          </div>
          <Toggle
            checked={theme === 'dark'}
            onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
          />
        </div>
      </Card>

      {/* Security */}
      <SLabel className="gap-12">Security</SLabel>
      <Card className="gap-20">
        <div className="sec-row">
          <div>
            <div className="sec-row-label">
              <Ic n="lock" s={14} c="var(--blue)" /> Password
            </div>
            <div className="sec-row-sub">Last changed 3 months ago</div>
          </div>
          <Btn variant="secondary" size="sm">Change password</Btn>
        </div>
        <div className="sec-row">
          <div>
            <div className="sec-row-label">
              <Ic n="shield" s={14} c="var(--blue)" /> Two-factor authentication
            </div>
            <div className="sec-row-sub">Add an extra layer of security</div>
          </div>
          <Toggle checked={twofa} onChange={e => setTwofa(e.target.checked)} />
        </div>
      </Card>

      {/* Online account (Supabase) */}
      <SLabel className="gap-12">Online Account (optional)</SLabel>
      <Card className="gap-20">
        {authUser ? (
          <div className="sec-row">
            <div>
              <div className="sec-row-label"><Ic n="check" s={14} c="var(--success)" /> Signed in</div>
              <div className="sec-row-sub">{authUser.email}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={handleLogout}>Sign out</Btn>
          </div>
        ) : (
          <>
            <div className="sec-row-sub">Sign in to search and share public reviewers.</div>
            <div className="fields-grid">
              <FormInput label="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" />
              <FormInput label="Password" value={loginPw}  onChange={e => setLoginPw(e.target.value)}   type="password" />
            </div>
            {authErr && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{authErr}</div>}
            <div className="save-row">
              <Btn variant="primary" size="sm" onClick={handleLogin} disabled={authBusy}>
                {authBusy ? 'Signing in…' : 'Sign in / Register'}
              </Btn>
            </div>
          </>
        )}
      </Card>

      {/* Storage */}
      <SLabel className="gap-12">Storage</SLabel>
      <Card className="gap-16">
        {storage ? (
          <>
            <div className="sec-row-sub">Database: {fmtBytes(storage.db_size_bytes)}</div>
            <div className="sec-row-sub">Outputs: {fmtBytes(storage.outputs_size_bytes)}</div>
            <div className="sec-row-sub">Embeddings: {fmtBytes(storage.chroma_size_bytes)}</div>
            <div className="sec-row-sub" style={{ fontWeight: 600 }}>Total: {fmtBytes(storage.total_bytes)}</div>
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

      {/* Session */}
      <SLabel className="gap-12">Session</SLabel>
      <Card className="gap-20">
        <div className="sec-row">
          <div>
            <div className="sec-row-label text-danger">
              <Ic n="signout" s={14} /> Sign out
            </div>
            <div className="sec-row-sub">End your current session</div>
          </div>
          <Btn variant="danger" size="sm">Sign out</Btn>
        </div>
      </Card>
    </>
  );
}
