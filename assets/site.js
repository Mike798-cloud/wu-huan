(function(){
  const NS='wuhuan:';
  function get(k){try{return localStorage.getItem(NS+k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(NS+k,v)}catch(e){}}
  document.querySelectorAll('.choice-box').forEach(box=>{
    const key=box.dataset.key||''; const answer=box.dataset.answer;
    const feedback=box.querySelector('.feedback'); const reveal=box.querySelector('.reveal');
    const solved=get(key)==='1';
    if(solved){
      const btn=box.querySelector('[data-choice="'+answer+'"]'); if(btn) btn.classList.add('correct');
      if(feedback) feedback.textContent=box.dataset.ok||'该项已写入归档。'; if(reveal) reveal.hidden=false;
    }
    box.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>{
      box.querySelectorAll('.choice').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      if(btn.dataset.choice===answer){
        btn.classList.add('correct'); set(key,'1'); if(feedback) feedback.textContent=box.dataset.ok||'该项已写入归档。'; if(reveal) reveal.hidden=false;
        if(key.startsWith('review')) checkReview();
      }else{
        if(feedback) feedback.textContent=box.dataset.bad||'当前归档与原文表述不符。';
      }
    }));
  });
  function checkReview(){
    const link=document.getElementById('final-link'); if(!link) return;
    if(get('review1')==='1'&&get('review2')==='1'&&get('review3')==='1') link.hidden=false;
  }
  checkReview();


  const params=new URLSearchParams(location.search);
  const pageName=(location.pathname.split('/').pop()||'index.html');
  const routeRef=params.get('ref');
  if(routeRef) set('ctx:'+pageName,routeRef);
  const ref=routeRef||get('ctx:'+pageName);
  if(ref){
    document.querySelectorAll('[data-ref-context]').forEach(el=>{
      const refs=(el.dataset.refContext||'').split(/\s+/);
      if(refs.includes(ref)) el.hidden=false;
    });
  }

  const journalCompare=document.getElementById('journal-compare');
  if(journalCompare){
    const routeSubject=params.get('subject');
    if(routeSubject) set('subject:'+pageName,routeSubject);
    const subject=routeSubject||get('subject:'+pageName);
    if(subject==='lin') journalCompare.hidden=false;
  }
  const bgm=document.getElementById('bgm'); const toggle=document.getElementById('music-toggle');
  if(bgm&&toggle){
    bgm.volume=.18;
    const sync=()=>{toggle.textContent=bgm.paused?'音乐：关':'音乐：开'};
    toggle.addEventListener('click',()=>{if(bgm.paused){bgm.play().catch(()=>{});}else bgm.pause(); sync()}); sync();
  }
})();
