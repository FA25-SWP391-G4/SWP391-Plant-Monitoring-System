import React, { useRef, useState } from 'react';

function replyFor(text) {
  const t = text.toLowerCase();
  if (t.includes('water') || t.includes('tưới')) return 'Soil under 30% → water for 20–30s. For herbs, keep 35–45%.';
  if (t.includes('light') || t.includes('ánh')) return 'Aim for 60–75% light for most indoor plants. Avoid >85% for Rosemary.';
  if (t.includes('fertil')) return 'Fertilize every 2–4 weeks in growing season. Use half-strength balanced NPK.';
  if (t.includes('disease') || t.includes('bệnh')) return 'Check leaves underside. Isolate plant, trim infected parts, improve airflow.';
  return 'Got it! I’ll keep an eye on sensors and remind you if thresholds are crossed.';
}

export default function ChatBox() {
  const [msgs, setMsgs] = useState([
    { who: 'ai', text: 'Hi! I’m your Smart Garden assistant. Ask me about watering, light, or plant care.' }
  ]);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  const send = (e) => {
    e.preventDefault();
    const s = text.trim();
    if (!s) return;
    const ai = replyFor(s);
    setMsgs(m => [...m, { who:'me', text: s }, { who:'ai', text: ai }]);
    setText('');
    setTimeout(()=> endRef.current?.scrollIntoView({behavior:'smooth'}), 0);
  };

  return (
    <div className="chat-box">
      <div className="chat-body">
        {msgs.map((m,i)=>(
          <div key={i} className={`chat-msg ${m.who==='me'?'chat-user':'chat-ai'}`}>{m.text}</div>
        ))}
        <div ref={endRef}></div>
      </div>
      <form onSubmit={send} className="d-flex border-top">
        <input className="form-control border-0 rounded-0" placeholder="Type a message…" value={text} onChange={e=>setText(e.target.value)} />
        <button className="btn btn-success rounded-0"><i className="bi bi-send"></i></button>
      </form>
    </div>
  );
}
