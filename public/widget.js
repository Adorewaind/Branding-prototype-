(function () {
  var businessId = document.currentScript.getAttribute('data-business');
  if (!businessId) return;

  var appUrl = new URL(document.currentScript.src).origin;

  var style = document.createElement('style');
  style.textContent = '#apex-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6b8cff,#c084fc);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(107,140,255,0.4);z-index:9998;border:none;transition:transform 0.2s}#apex-btn:hover{transform:scale(1.08)}#apex-frame{position:fixed;bottom:96px;right:24px;width:380px;height:600px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.25);z-index:9999;display:none;overflow:hidden;border:none}@media(max-width:480px){#apex-frame{width:100vw;height:100vh;bottom:0;right:0;border-radius:0}}';
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'apex-btn';
  btn.setAttribute('aria-label', 'Open AI Receptionist');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

  var frame = document.createElement('iframe');
  frame.id = 'apex-frame';
  frame.src = appUrl + '/widget/' + businessId;
  frame.title = 'AI Receptionist';
  frame.allow = 'clipboard-write';

  document.body.appendChild(btn);
  document.body.appendChild(frame);

  var open = false;
  btn.addEventListener('click', function () {
    open = !open;
    frame.style.display = open ? 'block' : 'none';
    btn.innerHTML = open
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  });
})();
