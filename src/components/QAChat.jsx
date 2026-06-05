import { useState } from "react";
import { Ic } from "./ui/Icons";
import { QA_CHAT } from "../data/mockData";

export function QAChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg]       = useState("");

  return (
    <div className="qa-float-root">

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="qa-window">

          {/* Header */}
          <div className="qa-window-header">
            <div className="qa-window-title">{QA_CHAT.title}</div>
            <div className="qa-window-sub">{QA_CHAT.subtitle}</div>
          </div>

          {/* Messages */}
          <div className="chat-messages qa-messages">
            <div className="chat-msg chat-user">
              <div className="chat-bubble bubble-user">{QA_CHAT.seedUser}</div>
            </div>
            <div className="chat-msg chat-ai">
              <div className="chat-bubble bubble-ai">
                Based on your <strong>{QA_CHAT.seedAiBold}</strong> file,{" "}
                {QA_CHAT.seedAi.replace(/^Based on your .+ file, /, "")}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="chat-input-row qa-input-row">
            <input
              className="chat-input qa-input"
              placeholder={QA_CHAT.placeholder}
              value={msg}
              onChange={e => setMsg(e.target.value)}
            />
            <button className="chat-send"><Ic n="send" s={14} /></button>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        className={`qa-fab${isOpen ? " qa-fab--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <Ic n="x" s={24} c="white" /> : <Ic n="sparkles" s={24} c="white" />}
      </button>

    </div>
  );
}