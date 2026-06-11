import { useEffect, useRef, useState } from "react";
import { Ic } from "./ui/Icons";
import { QA_CHAT } from "../data/mockData";
import { chatApi } from "../api/chat.js";
import { useStore } from "../store/useStore.js";

// Soft limit: show a warning; hard limit: block sending
const SOFT_LIMIT = 10;
const HARD_LIMIT = 20;

export function QAChat() {
  const [isOpen,       setIsOpen]      = useState(false);
  const [msg,          setMsg]         = useState("");
  const [messages,     setMsgs]        = useState([]);
  const [sending,      setSend]        = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  // null = all source files; array of ids = specific files only
  const [selectedFileIds, setSelectedFileIds] = useState(null);
  const [showFilePicker,  setShowFilePicker]   = useState(false);

  const activeFolderId    = useStore(s => s.activeFolderId);
  const sourceFiles       = useStore(s =>
    activeFolderId ? (s.sourceFiles[activeFolderId] ?? []) : []
  );
  const unlockAchievement = useStore(s => s.unlockAchievement);
  const bottomRef = useRef(null);

  // Load history when panel opens
  useEffect(() => {
    if (!isOpen || !activeFolderId) return;
    chatApi.getHistory(activeFolderId).then(setMsgs).catch(() => {});
  }, [isOpen, activeFolderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset rate limit and file selection when folder changes
  useEffect(() => {
    setSessionCount(0);
    setSelectedFileIds(null);
  }, [activeFolderId]);

  const atSoftLimit = sessionCount >= SOFT_LIMIT && sessionCount < HARD_LIMIT;
  const atHardLimit = sessionCount >= HARD_LIMIT;

  const send = async () => {
    const text = msg.trim();
    if (!text || !activeFolderId || sending || atHardLimit) return;

    setMsg("");
    setSend(true);
    setSessionCount(c => c + 1);
    setMsgs(prev => [...prev, { role: 'user', content: text, id: Date.now() }]);
    // First-ever chat message achievement
    unlockAchievement('talk_reviewbot');

    try {
      // Pass file_ids only when a subset is selected (null = all)
      const fileIds = selectedFileIds?.length === sourceFiles.length ? null : selectedFileIds;
      const res = await chatApi.send(activeFolderId, text, fileIds);
      setMsgs(prev => [...prev, res]);
    } catch {
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: 'Error: could not reach the backend.',
        id: Date.now() + 1,
      }]);
    } finally {
      setSend(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Toggle a single file in/out of the selection
  const toggleFile = (fileId) => {
    if (selectedFileIds === null) {
      // All selected → deselect this one
      setSelectedFileIds(sourceFiles.map(f => f.id).filter(id => id !== fileId));
    } else {
      const has     = selectedFileIds.includes(fileId);
      const newIds  = has
        ? selectedFileIds.filter(id => id !== fileId)
        : [...selectedFileIds, fileId];
      // If everything is now selected, revert to null (= all)
      setSelectedFileIds(newIds.length === sourceFiles.length ? null : newIds);
    }
  };

  const isFileSelected = (fileId) =>
    selectedFileIds === null || selectedFileIds.includes(fileId);

  const selectedCount = selectedFileIds === null
    ? sourceFiles.length
    : selectedFileIds.length;

  return (
    <div className="qa-float-root">

      {isOpen && (
        <div className="qa-window">
          {/* Header */}
          <div className="qa-window-header">
            <div className="qa-header-top">
              <div className="qa-window-title">{QA_CHAT.title}</div>
              {sourceFiles.length > 0 && (
                <button
                  className={`qa-files-btn${selectedFileIds !== null ? ' qa-files-btn--partial' : ''}`}
                  onClick={() => setShowFilePicker(v => !v)}
                  title="Filter source files"
                >
                  <Ic n="files" s={13} />
                  {selectedFileIds !== null && (
                    <span className="qa-files-count">{selectedCount}/{sourceFiles.length}</span>
                  )}
                </button>
              )}
            </div>
            <div className="qa-window-sub">
              {activeFolderId ? QA_CHAT.subtitle : 'Open a folder to start chatting'}
            </div>
            <div className="qa-disclaimer">
              AI-generated — may make mistakes. Always verify with your source materials.
            </div>
          </div>

          {/* File picker */}
          {showFilePicker && sourceFiles.length > 0 && (
            <div className="qa-file-picker">
              <div className="qa-file-picker-label">
                Query sources <span className="qa-file-picker-count">({selectedCount} selected)</span>
              </div>
              {sourceFiles.map(f => (
                <label key={f.id} className="qa-file-item">
                  <input
                    type="checkbox"
                    checked={isFileSelected(f.id)}
                    onChange={() => toggleFile(f.id)}
                  />
                  <span className="qa-file-name">{f.original_name ?? f.name ?? `File ${f.id}`}</span>
                </label>
              ))}
              {selectedCount === 0 && (
                <div className="qa-file-none-warn">Select at least one file or the AI will have no context.</div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages qa-messages">
            {messages.length === 0 && (
              <div className="chat-msg chat-ai">
                <div className="chat-bubble bubble-ai">
                  {activeFolderId
                    ? 'Ask me anything about your study materials!'
                    : 'Open a folder from Study Files to enable Q&A chat.'}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id ?? i} className={`chat-msg ${m.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                <div className={`chat-bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                  {m.content}
                  {m.citations?.length > 0 && (
                    <div className="chat-citations">
                      Sources: {m.citations.map(c => `${c.file_name} pp.${c.page_range}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="chat-msg chat-ai">
                <div className="chat-bubble bubble-ai">Thinking…</div>
              </div>
            )}

            {/* Rate-limit notices */}
            {atSoftLimit && (
              <div className="qa-rate-notice qa-rate-soft">
                You've sent {sessionCount} messages this session — take a moment to review the responses.
              </div>
            )}
            {atHardLimit && (
              <div className="qa-rate-notice qa-rate-hard">
                Session limit reached ({HARD_LIMIT} messages). Close and reopen the chat to start a new session.
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row qa-input-row">
            <input
              className="chat-input qa-input"
              placeholder={
                atHardLimit   ? 'Session limit reached' :
                !activeFolderId ? 'Open a folder first…' :
                QA_CHAT.placeholder
              }
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={onKey}
              disabled={!activeFolderId || sending || atHardLimit}
            />
            <button
              className="chat-send"
              onClick={send}
              disabled={!activeFolderId || sending || atHardLimit}
            >
              <Ic n="send" s={14} />
            </button>
          </div>
        </div>
      )}

      <button
        className={`qa-fab${isOpen ? " qa-fab--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen
          ? <Ic n="x" s={24} c="white" />
          : <Ic n="sparkles" s={24} c="white" />
        }
      </button>

    </div>
  );
}
