(function(){
  'use strict';

  const NS='wuhuan:';
  function get(k){try{return localStorage.getItem(NS+k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(NS+k,v)}catch(e){}}
  function clear(){try{Object.keys(localStorage).filter(k=>k.indexOf(NS)===0).forEach(k=>localStorage.removeItem(k))}catch(e){}}
  function isSolved(key){return get(key)==='1'}
  function markSeen(name){if(name)set('seen:'+name,'1')}
  function seen(name){return get('seen:'+name)==='1'}
  function routeDone(id){return get('route:'+id)==='1'}
  function markRoute(id){if(id)set('route:'+id,'1')}

  const params=new URLSearchParams(location.search);
  const pageName=(location.pathname.split('/').pop()||'index.html');
  const routeRef=params.get('ref');
  const pageSeenBefore=seen(pageName);

  if(routeRef) set('ctx:'+pageName,routeRef);
  const ref=routeRef||get('ctx:'+pageName);

  if(pageName==='five.html') markRoute('five');
  if(pageName==='testimonies.html' && (ref==='five'||routeDone('five'))) markRoute('testimonies');
  if(pageName==='visit.html' && (ref==='liang'||isSolved('liang'))) markRoute('visit');
  if(pageName==='faq.html' && (ref==='visit'||routeDone('visit'))) markRoute('faq');
  if(pageName==='family.html' && (ref==='faq'||routeDone('faq'))) markRoute('family');
  if(pageName==='lin.html' && (ref==='tang'||isSolved('tang'))) markRoute('lin');
  if(pageName==='early_lecture.html' && isSolved('oldmeaning')) markRoute('early_lecture');
  if(pageName==='linyao.html' && isSolved('evolution')) markRoute('linyao');
  if(pageName==='final.html') markRoute('final');

  function lockChoiceBox(box,answer){
    box.querySelectorAll('.choice').forEach(b=>{
      b.disabled=true;
      b.setAttribute('aria-disabled','true');
      if(b.dataset.choice===answer)b.classList.add('correct');
    });
  }

  const keyToRoute={
    chen:'chen',liang:'liang',linshift:'journal',review1:'review1',review2:'review2',review3:'review3'
  };

  document.querySelectorAll('.choice-box').forEach(box=>{
    const key=box.dataset.key||'';
    const answer=box.dataset.answer;
    const feedback=box.querySelector('.feedback');
    const reveal=box.querySelector('.reveal');
    if(feedback)feedback.setAttribute('aria-live','polite');
    if(isSolved(key)){
      lockChoiceBox(box,answer);
      if(feedback)feedback.textContent=box.dataset.ok||'该项已写入归档。';
      if(reveal)reveal.hidden=false;
    }
    box.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>{
      if(isSolved(key))return;
      box.querySelectorAll('.choice').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      if(btn.dataset.choice===answer){
        set(key,'1');
        if(keyToRoute[key])markRoute(keyToRoute[key]);
        lockChoiceBox(box,answer);
        if(feedback)feedback.textContent=box.dataset.ok||'该项已写入归档。';
        if(reveal)reveal.hidden=false;
        if(key.indexOf('review')===0)checkReview();
        syncRouteGuide();
      }else if(feedback){
        feedback.textContent=box.dataset.bad||'当前归档与原文表述不符。';
      }
    }));
  });

  function checkReview(){
    const link=document.getElementById('final-link');
    if(!link)return;
    const ready=isSolved('review1')&&isSolved('review2')&&isSolved('review3');
    link.hidden=!ready;
    if(ready)markRoute('review');
  }
  checkReview();

  document.querySelectorAll('.address-trace').forEach(panel=>{
    const key=panel.dataset.key||'tang';
    const buttons=[...panel.querySelectorAll('[data-year]')];
    const feedback=panel.querySelector('.feedback');
    const reveal=panel.querySelector('.reveal');
    const restore=()=>{
      if(!isSolved(key))return;
      buttons.forEach(b=>{b.classList.add('is-viewed');b.setAttribute('aria-pressed','true');if(b.dataset.stable==='1')b.classList.add('pattern-hit')});
      if(feedback)feedback.textContent='2015—2017连续三年的地址栏均为“宿舍3-6”。成员卷后页已展开。';
      if(reveal)reveal.hidden=false;
    };
    restore();
    buttons.forEach(btn=>{
      btn.setAttribute('aria-pressed',btn.classList.contains('is-viewed')?'true':'false');
      btn.addEventListener('click',()=>{
        if(isSolved(key))return;
        btn.classList.add('is-viewed');btn.setAttribute('aria-pressed','true');
        const n=buttons.filter(b=>b.classList.contains('is-viewed')).length;
        if(feedback)feedback.textContent='已查看 '+n+' / '+buttons.length+' 个年份。';
        if(n===buttons.length){
          set(key,'1');markRoute('tang');
          buttons.filter(b=>b.dataset.stable==='1').forEach(b=>b.classList.add('pattern-hit'));
          if(feedback)feedback.textContent='2015—2017连续三年的地址栏均为“宿舍3-6”。成员卷后页已展开。';
          if(reveal)reveal.hidden=false;
          syncRouteGuide();
        }
      });
    });
  });

  document.querySelectorAll('.phrase-trace').forEach(panel=>{
    const key=panel.dataset.key||'oldmeaning';
    const required=parseInt(panel.dataset.required||'5',10);
    const marks=[...document.querySelectorAll('.phrase-mark')];
    const feedback=panel.querySelector('.feedback');
    const reveal=panel.querySelector('.reveal');
    function restore(){
      if(!isSolved(key))return;
      marks.forEach(b=>{b.classList.add('is-marked');b.setAttribute('aria-pressed','true')});
      if(feedback)feedback.textContent='五处“还”的动作都已标记。旁注与同页登记已展开。';
      if(reveal)reveal.hidden=false;
    }
    restore();
    marks.forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(isSolved(key))return;
        btn.classList.add('is-marked');btn.setAttribute('aria-pressed','true');
        const n=marks.filter(b=>b.classList.contains('is-marked')).length;
        if(feedback)feedback.textContent='已标记 '+n+' / '+required+' 处。';
        if(n>=required){
          set(key,'1');markRoute('old_five');
          if(feedback)feedback.textContent='五处“还”的动作都已标记。旁注与同页登记已展开。';
          if(reveal)reveal.hidden=false;
          syncRouteGuide();
        }
      });
    });
  });

  document.querySelectorAll('.version-browser').forEach(panel=>{
    const key=panel.dataset.key||'evolution';
    const tabs=[...panel.querySelectorAll('[data-version]')];
    const rows=[...document.querySelectorAll('[data-version-row]')];
    const feedback=panel.querySelector('.feedback');
    const reveal=panel.querySelector('.reveal');
    function focusYear(year){
      rows.forEach(r=>r.classList.toggle('is-focused',r.dataset.versionRow===year));
      tabs.forEach(t=>t.classList.toggle('is-current',t.dataset.version===year));
    }
    if(isSolved(key)){
      tabs.forEach(t=>{t.classList.add('is-viewed');t.setAttribute('aria-pressed','true')});
      if(feedback)feedback.textContent='四个年份都已对读。校注与停止栏变化已展开。';
      if(reveal)reveal.hidden=false;
    }
    tabs.forEach(tab=>{
      tab.setAttribute('aria-pressed',tab.classList.contains('is-viewed')?'true':'false');
      tab.addEventListener('click',()=>{
        focusYear(tab.dataset.version);
        tab.classList.add('is-viewed');tab.setAttribute('aria-pressed','true');
        const n=tabs.filter(t=>t.classList.contains('is-viewed')).length;
        if(!isSolved(key)&&feedback)feedback.textContent='已对读 '+n+' / '+tabs.length+' 个版本。';
        if(n===tabs.length&&!isSolved(key)){
          set(key,'1');markRoute('evolution');
          if(feedback)feedback.textContent='四个年份都已对读。校注与停止栏变化已展开。';
          if(reveal)reveal.hidden=false;
          syncRouteGuide();
        }
      });
    });
  });

  document.querySelectorAll('.sequence-reader').forEach(panel=>{
    const key=panel.dataset.key||'linbehavior';
    const tabs=[...panel.querySelectorAll('[data-sequence]')];
    const rows=[...document.querySelectorAll('[data-sequence-row]')];
    const feedback=panel.querySelector('.feedback');
    const reveal=panel.querySelector('.reveal');
    function focusYear(year){
      rows.forEach(r=>r.classList.toggle('is-focused',r.dataset.sequenceRow===year));
      tabs.forEach(t=>t.classList.toggle('is-current',t.dataset.sequence===year));
    }
    if(isSolved(key)){
      tabs.forEach(t=>{t.classList.add('is-viewed');t.setAttribute('aria-pressed','true')});
      if(feedback)feedback.textContent='六个年份均已复核。内部批注与反对意见已展开。';
      if(reveal)reveal.hidden=false;
    }
    tabs.forEach(tab=>{
      tab.setAttribute('aria-pressed',tab.classList.contains('is-viewed')?'true':'false');
      tab.addEventListener('click',()=>{
        focusYear(tab.dataset.sequence);
        tab.classList.add('is-viewed');tab.setAttribute('aria-pressed','true');
        const n=tabs.filter(t=>t.classList.contains('is-viewed')).length;
        if(!isSolved(key)&&feedback)feedback.textContent='已复核 '+n+' / '+tabs.length+' 个年份。';
        if(n===tabs.length&&!isSolved(key)){
          set(key,'1');markRoute('late_notes');
          if(feedback)feedback.textContent='六个年份均已复核。私人记录先发生变化，公开教义随后逐年改写；内部批注已展开。';
          if(reveal)reveal.hidden=false;
          syncRouteGuide();
        }
      });
    });
  });

  if(ref){
    document.querySelectorAll('[data-ref-context]').forEach(el=>{
      const refs=(el.dataset.refContext||'').split(/\s+/);
      if(refs.includes(ref))el.hidden=false;
    });
  }

  const journalCompare=document.getElementById('journal-compare');
  if(journalCompare){
    const routeSubject=params.get('subject');
    if(routeSubject)set('subject:'+pageName,routeSubject);
    const subject=routeSubject||get('subject:'+pageName);
    if(subject==='lin')journalCompare.hidden=false;
  }

  const searchIndex=[
    ['五还法门','five.html','第一次浏览建议先读：现行五项说明与练习记录'],
    ['归席见证','testimonies.html','公开成员卷：陈素琴、梁伟及住宿成员资料'],
    ['本社沿革','history.html','背景资料：创立、场地与历年公开沿革'],
    ['静修问答','faq.html','来访、练习中止与家属沟通'],
    ['社中刊录','journal.html','旧刊卷次、补录目录与历年修订'],
    ['来访须知','visit.html','初访、住宿、携带物与联系安排']
  ];
  document.querySelectorAll('[data-site-search]').forEach(form=>{
    const input=form.querySelector('input');
    const panel=form.querySelector('[data-search-results]');
    if(!input||!panel)return;
    function render(q){
      const term=(q||'').trim().toLowerCase();
      const hits=term?searchIndex.filter(x=>(x[0]+' '+x[2]).toLowerCase().includes(term)):searchIndex;
      panel.innerHTML=hits.length?hits.map(x=>'<a href="'+x[1]+'"><strong>'+x[0]+'</strong><br><span>'+x[2]+'</span></a>').join(''):'<span>公开索引中未找到相关栏目。</span>';
      panel.hidden=false;
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(getComputedStyle(input).display==='none'){
        form.classList.add('search-open');
        setTimeout(()=>input.focus(),0);
        return;
      }
      render(input.value);
    });
    input.addEventListener('input',()=>{if(input.value.trim())render(input.value);else panel.hidden=true});
    input.addEventListener('focus',()=>{if(input.value.trim())render(input.value)});
    document.addEventListener('click',e=>{if(!form.contains(e.target))panel.hidden=true});
  });

  const currentNav=document.querySelector('.nav a.current');
  if(currentNav&&currentNav.parentElement){
    requestAnimationFrame(()=>{
      const wrap=currentNav.parentElement;
      const target=currentNav.offsetLeft-(wrap.clientWidth-currentNav.offsetWidth)/2;
      wrap.scrollLeft=Math.max(0,target);
    });
  }

  const bgm=document.getElementById('bgm');
  const toggle=document.getElementById('music-toggle');
  if(bgm&&toggle){
    bgm.volume=.18;
    const sync=()=>{
      toggle.textContent=bgm.paused?'音乐：关':'音乐：开';
      toggle.setAttribute('aria-pressed',String(!bgm.paused));
    };
    toggle.addEventListener('click',()=>{
      if(bgm.paused)bgm.play().catch(()=>{});else bgm.pause();
      sync();
    });
    sync();
  }

  document.querySelectorAll('[data-reset-progress]').forEach(btn=>btn.addEventListener('click',()=>{
    clear();
    btn.textContent='本地阅览标记已清除';
    btn.disabled=true;
  }));

  document.querySelectorAll('.world-links').forEach(group=>{
    [...group.querySelectorAll('a')].forEach((a,index)=>a.dataset.linkRole=index===0?'main':'side');
  });


  document.querySelectorAll('[data-evidence-group]').forEach(group=>{
    const key=group.dataset.evidenceGroup;
    const need=Number(group.dataset.evidenceNeed||group.querySelectorAll('[data-evidence]').length||1);
    const feedback=group.querySelector('[data-evidence-feedback]');
    const reveal=group.querySelector('[data-evidence-reveal]');
    const marked=new Set((get('evidence:'+key)||'').split(',').filter(Boolean));
    if(isSolved(key) && marked.size===0){
      group.querySelectorAll('[data-evidence-valid="1"]').forEach(el=>marked.add(el.dataset.evidence));
      set('evidence:'+key,[...marked].join(','));
    }
    function renderEvidence(){
      group.querySelectorAll('[data-evidence]').forEach(item=>{
        const id=item.dataset.evidence;
        item.classList.toggle('marked-evidence',marked.has(id));
        item.setAttribute('aria-pressed',String(marked.has(id)));
      });
      const validCount=[...marked].filter(id=>{const el=group.querySelector('[data-evidence="'+id+'"]');return el&&el.dataset.evidenceValid!=='0'}).length;
      if(validCount>=need){
        set(key,'1');
        if(reveal) reveal.hidden=false;
        if(feedback) feedback.textContent=group.dataset.evidenceOk||'这些材料已经能互相对应。';
      }else if(feedback){
        feedback.textContent=`已标记 ${validCount} / ${need} 条直接相关材料。`;
      }
    }
    group.querySelectorAll('[data-evidence]').forEach(item=>item.addEventListener('click',()=>{
      const id=item.dataset.evidence;
      if(item.dataset.evidenceValid==='0') {
        item.classList.add('rejected-evidence');
        setTimeout(()=>item.classList.remove('rejected-evidence'),500);
        if(feedback) feedback.textContent='这条属于生活背景，不能直接回答当前对读问题。';
        return;
      }
      if(marked.has(id)) marked.delete(id); else marked.add(id);
      set('evidence:'+key,[...marked].join(','));
      renderEvidence();
      syncRouteGuide();
    }));
    renderEvidence();
  });



  // Semantic document interactions. These replace repeated quiz-style gating.
  document.querySelectorAll('.pattern-trace[data-trace="address"]').forEach(group=>{
    const key=group.dataset.key||'tang';
    const feedback=group.querySelector('.feedback');
    const reveal=group.querySelector('.reveal');
    const viewed=new Set((get('trace:'+key)||'').split(',').filter(Boolean));
    const buttons=[...group.querySelectorAll('[data-year]')];
    if(isSolved(key) && viewed.size===0){buttons.forEach(btn=>viewed.add(btn.dataset.year));set('trace:'+key,[...viewed].join(','));}
    function render(){
      buttons.forEach(btn=>{
        const y=btn.dataset.year;
        btn.classList.toggle('is-viewed',viewed.has(y));
        btn.classList.toggle('pattern-hit',viewed.has(y)&&btn.dataset.stable==='1');
      });
      const all=buttons.every(btn=>viewed.has(btn.dataset.year));
      if(all){
        set(key,'1');
        if(reveal) reveal.hidden=false;
        if(feedback) feedback.textContent='2011—2014每年都在变；2015—2017连续三年保持同一宿舍地址。';
      }else if(feedback){
        feedback.textContent=`已查看 ${viewed.size} / ${buttons.length} 个年份。`;
      }
    }
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      viewed.add(btn.dataset.year);
      set('trace:'+key,[...viewed].join(','));
      render(); syncRouteGuide();
    }));
    render();
  });

  document.querySelectorAll('.phrase-trace').forEach(group=>{
    const key=group.dataset.key||'oldmeaning';
    const required=Number(group.dataset.required||5);
    const feedback=group.querySelector('.feedback');
    const reveal=group.querySelector('.reveal');
    const marked=new Set((get('phrases:'+key)||'').split(',').filter(Boolean));
    const buttons=[...document.querySelectorAll('.phrase-mark[data-phrase]')];
    if(isSolved(key) && marked.size===0){buttons.forEach(btn=>marked.add(btn.dataset.phrase));set('phrases:'+key,[...marked].join(','));}
    function render(){
      buttons.forEach(btn=>{
        const id=btn.dataset.phrase;
        const on=marked.has(id);
        btn.classList.toggle('is-marked',on);
        btn.setAttribute('aria-pressed',String(on));
      });
      if(marked.size>=required){
        set(key,'1');
        if(reveal) reveal.hidden=false;
        if(feedback) feedback.textContent='五句都指向“把形、声、香、名、物安放到别处”，而不是把人带回来。';
      }else if(feedback){
        feedback.textContent=marked.size?`已标记 ${marked.size} / ${required} 处。`:'尚未标记。';
      }
    }
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.phrase;
      if(marked.has(id)) marked.delete(id); else marked.add(id);
      set('phrases:'+key,[...marked].join(','));
      render(); syncRouteGuide();
    }));
    render();
  });

  document.querySelectorAll('.version-browser').forEach(group=>{
    const key=group.dataset.key||'evolution';
    const feedback=group.querySelector('.feedback');
    const reveal=group.querySelector('.reveal');
    const viewed=new Set((get('versions:'+key)||'').split(',').filter(Boolean));
    const buttons=[...group.querySelectorAll('[data-version]')];
    if(isSolved(key) && viewed.size===0){buttons.forEach(btn=>viewed.add(btn.dataset.version));set('versions:'+key,[...viewed].join(','));}
    function focus(version){
      document.querySelectorAll('[data-version-row]').forEach(row=>row.classList.toggle('is-focused',row.dataset.versionRow===version));
      buttons.forEach(btn=>btn.classList.toggle('is-current',btn.dataset.version===version));
    }
    function render(){
      buttons.forEach(btn=>btn.classList.toggle('is-viewed',viewed.has(btn.dataset.version)));
      if(buttons.every(btn=>viewed.has(btn.dataset.version))){
        set(key,'1');
        if(reveal) reveal.hidden=false;
        if(feedback) feedback.textContent='四版已对读：2009开始出现“暂存、不宜急断、完整保存”，2011进一步转成“返、应、附”。';
      }else if(feedback){
        feedback.textContent=`已对读 ${viewed.size} / ${buttons.length} 个版本。`;
      }
    }
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      viewed.add(btn.dataset.version);
      set('versions:'+key,[...viewed].join(','));
      focus(btn.dataset.version); render(); syncRouteGuide();
    }));
    if(viewed.size) focus([...viewed].pop());
    render();
  });

  document.querySelectorAll('.sequence-reader').forEach(group=>{
    const key=group.dataset.key||'linbehavior';
    const feedback=group.querySelector('.feedback');
    const reveal=group.querySelector('.reveal');
    const viewed=new Set((get('sequence:'+key)||'').split(',').filter(Boolean));
    const buttons=[...group.querySelectorAll('[data-sequence]')];
    if(isSolved(key) && viewed.size===0){buttons.forEach(btn=>viewed.add(btn.dataset.sequence));set('sequence:'+key,[...viewed].join(','));}
    function focus(year){
      document.querySelectorAll('[data-sequence-row]').forEach(row=>row.classList.toggle('is-focused',row.dataset.sequenceRow===year));
      buttons.forEach(btn=>btn.classList.toggle('is-current',btn.dataset.sequence===year));
    }
    function render(){
      buttons.forEach(btn=>btn.classList.toggle('is-viewed',viewed.has(btn.dataset.sequence)));
      if(buttons.every(btn=>viewed.has(btn.dataset.sequence))){
        set(key,'1');
        if(reveal) reveal.hidden=false;
        if(feedback) feedback.textContent='顺序已经清楚：先是2008年私人生活无法收拾，之后公开教义才逐年向“保留”偏移。';
      }else if(feedback){
        feedback.textContent=`已复核 ${viewed.size} / ${buttons.length} 个年份。`;
      }
    }
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      viewed.add(btn.dataset.sequence);
      set('sequence:'+key,[...viewed].join(','));
      focus(btn.dataset.sequence); render(); syncRouteGuide();
    }));
    if(viewed.size) focus([...viewed].pop());
    render();
  });

  const ROUTE=[
    {id:'five',label:'五还法门',href:'five.html',complete:()=>routeDone('five')},
    {id:'testimonies',label:'归席见证',href:'testimonies.html?ref=five',complete:()=>routeDone('testimonies')},
    {id:'chen',label:'陈素琴 / 还口记录',href:'chen.html',complete:()=>isSolved('chen')},
    {id:'liang',label:'梁伟 / 还耳记录',href:'liang.html',complete:()=>isSolved('liang')},
    {id:'visit',label:'来访须知',href:'visit.html?ref=liang',complete:()=>routeDone('visit')},
    {id:'faq',label:'静修问答',href:'faq.html?ref=visit',complete:()=>routeDone('faq')},
    {id:'family',label:'家属留言摘录',href:'family.html?ref=faq',complete:()=>routeDone('family')},
    {id:'tang',label:'唐宁 / 住宿成员记录',href:'tang.html?ref=family',complete:()=>isSolved('tang')},
    {id:'lin',label:'林慧贞 / 历年文稿',href:'lin.html?ref=tang',complete:()=>routeDone('lin')},
    {id:'journal',label:'林慧贞历年刊录',href:'journal.html?subject=lin&ref=lin',complete:()=>isSolved('linshift')},
    {id:'old_five',label:'2003年《五还旧文》',href:'old_five.html',complete:()=>isSolved('oldmeaning')},
    {id:'early_lecture',label:'2003年早年讲义',href:'early_lecture.html',complete:()=>routeDone('early_lecture')},
    {id:'evolution',label:'五还沿革校注',href:'evolution.html',complete:()=>isSolved('evolution')},
    {id:'linyao',label:'林遥相关材料',href:'linyao.html',complete:()=>routeDone('linyao')},
    {id:'late_notes',label:'林慧贞后期文稿',href:'late_notes.html',complete:()=>isSolved('linbehavior')},
    {id:'review',label:'资料整理表',href:'review.html',complete:()=>isSolved('review1')&&isSolved('review2')&&isSolved('review3')},
    {id:'final',label:'阅览结语',href:'final.html',complete:()=>routeDone('final')}
  ];

  const PAGE_META={
    'home.html':{label:'本站首页',role:'hub'},
    'history.html':{label:'本社沿革',role:'background'},
    'five.html':{label:'五还法门',role:'sequence'},
    'testimonies.html':{label:'归席见证',role:'sequence'},
    'chen.html':{label:'陈素琴 / 还口记录',role:'sequence'},
    'liang.html':{label:'梁伟 / 还耳记录',role:'sequence'},
    'visit.html':{label:'来访须知',role:'sequence'},
    'faq.html':{label:'静修问答',role:'sequence'},
    'family.html':{label:'家属留言摘录',role:'sequence'},
    'tang.html':{label:'唐宁 / 住宿成员记录',role:'sequence'},
    'lin.html':{label:'林慧贞 / 历年文稿',role:'sequence'},
    'journal.html':{label:'社中刊录',role:'sequence'},
    'old_five.html':{label:'五还旧文',role:'sequence'},
    'early_lecture.html':{label:'早年讲义',role:'sequence'},
    'evolution.html':{label:'五还沿革校注',role:'sequence'},
    'linyao.html':{label:'林遥相关材料',role:'sequence'},
    'late_notes.html':{label:'林慧贞后期文稿',role:'sequence'},
    'review.html':{label:'资料整理表',role:'sequence'}
  };

  function nextStep(){for(const step of ROUTE)if(!step.complete())return step;return null}
  function currentStep(){
    const base=pageName;
    return ROUTE.find(step=>step.href.split('?')[0]===base)||null;
  }

  function syncRouteGuide(){
    const main=document.querySelector('main.content');
    if(!main||pageName==='home.html'||pageName==='final.html')return;
    const meta=PAGE_META[pageName]||{label:document.title.replace(/\s*-.*$/,''),role:'background'};
    const next=nextStep();
    const current=currentStep();
    const ci=current?ROUTE.findIndex(x=>x.id===current.id):-1;
    const ni=next?ROUTE.findIndex(x=>x.id===next.id):ROUTE.length;
    const onRecommendedFirstVisit=meta.role==='sequence'&&!pageSeenBefore&&current&&(ci===ni||ci===ni-1);
    const currentlyPending=current&&next&&current.id===next.id;
    const expectedRefByPage={'testimonies.html':'five','visit.html':'liang','faq.html':'visit','family.html':'faq','tang.html':'family','lin.html':'tang'};
    const arrivedFromExpectedRef=(expectedRefByPage[pageName]&&routeRef===expectedRefByPage[pageName])||(pageName==='journal.html'&&params.get('subject')==='lin');

    let old=document.getElementById('route-guide');
    if((onRecommendedFirstVisit||currentlyPending||arrivedFromExpectedRef)&&meta.role!=='background'){
      if(old)old.remove();
      return;
    }
    let guide=old;
    if(!guide){
      guide=document.createElement('section');
      guide.id='route-guide';guide.className='route-guide';
      main.insertBefore(guide,main.firstElementChild||null);
    }
    guide.classList.toggle('is-background',meta.role==='background');
    let title='',copy='';
    const actions=[];
    if(meta.role==='background'){
      title='这页主要是背景资料';
      copy=next?('本页可单独查阅，不必在这里把所有材料拼成结论。若你在按卷次连续阅读，当前建议回到《'+next.label+'》。'):'本页可作为背景资料单独查阅。';
      if(next)actions.push('<a class="route-btn" href="'+next.href+'">继续上次阅览：'+next.label+'</a>');
      actions.push('<a class="route-btn route-btn-secondary" href="home.html">回本站首页</a>');
    }else if(next){
      title='继续上次的连续阅览';
      copy='你当前打开的是一份可单独查阅的资料。若要接着上一次的卷次顺序，下一份是《'+next.label+'》。';
      actions.push('<a class="route-btn" href="'+next.href+'">继续：'+next.label+'</a>');
      actions.push('<a class="route-btn route-btn-secondary" href="home.html">回本站首页</a>');
    }else{
      title='公开资料已读至末页';
      copy='当前没有新的卷内引用，可以返回首页重新查阅公开栏目。';
      actions.push('<a class="route-btn route-btn-secondary" href="home.html">回本站首页</a>');
    }
    guide.innerHTML='<div class="route-guide-copy"><span class="route-guide-label">本站阅览建议</span><h2>'+title+'</h2><p>'+copy+'</p></div><div class="route-guide-actions">'+actions.join('')+'</div>';
  }
  syncRouteGuide();
  markSeen(pageName);
})();
