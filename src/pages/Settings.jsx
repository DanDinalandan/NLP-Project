import { useState } from "react";
import { Avatar }    from "../components/ui/Avatar.jsx";
import { Btn }       from "../components/ui/Btn.jsx";
import { Card }      from "../components/ui/Card.jsx";
import { FormInput } from "../components/ui/FormInput.jsx";
import { Ic }        from "../components/ui/Icons.jsx";
import { SLabel }    from "../components/ui/SLabel.jsx";
import { Toggle }    from "../components/ui/Toggle.jsx";
import { USER }      from "../data/mockData.js";

export function Settings() {
  const [twofa,  setTwofa]  = useState(true);
  const [first,  setFirst]  = useState(USER.firstName);
  const [last,   setLast]   = useState(USER.lastName);
  const [email,  setEmail]  = useState(USER.email);
  const [uname,  setUname]  = useState(USER.username);

  return (
    <>
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