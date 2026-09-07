/**
 * 通用付费打赏系统 v1.0
 * 《五还》版本：沿用《松涛粮站》的 1 元自愿打赏流程、双按钮与本地标记逻辑，
 * 仅调整《五还》的文案、按钮位置与自动出现时机。
 */
(function(){
'use strict';

const Paywall = {
  STORAGE_KEY: '_wuhuan_support',
  SESSION_KEY: '_wuhuan_support_session',
  COOKIE_KEY: '_wuhuan_pay_flag',
  AUTO_KEY: '_wuhuan_support_auto_shown',
  AUTO_COOKIE_KEY: '_wuhuan_support_auto',
  TAB_PAID: '__WUHuan_SUPPORTED__',
  TAB_AUTO: '__WUHuan_PAYWALL_SHOWN__',
  DEFAULT_CONFIG: {
    qrCode: 'assets/paycode.png',
    price: '1元',
    title: '支持《五还》',
    studio: 'abc studio'
  },
  _lastFocus: null,
  _autoTimer: 0,

  _localStore(){try{return window.localStorage}catch(_){return null}},
  _sessionStore(){try{return window.sessionStorage}catch(_){return null}},
  _safeGet(store,key){try{return store?store.getItem(key)||'':''}catch(_){return ''}},
  _safeSet(store,key,value){try{if(store)store.setItem(key,value)}catch(_){}},

  hasPaid(){
    let tab='';
    try{tab=window.name||''}catch(_){}
    return !!(
      this._safeGet(this._localStore(),this.STORAGE_KEY) ||
      this._safeGet(this._sessionStore(),this.SESSION_KEY) ||
      this._getCookie(this.COOKIE_KEY) ||
      tab.includes(this.TAB_PAID)
    );
  },

  markPaid(){
    const token=this._generateToken();
    this._safeSet(this._localStore(),this.STORAGE_KEY,token);
    this._safeSet(this._sessionStore(),this.SESSION_KEY,token);
    this._setCookie(this.COOKIE_KEY,token,365);
    try{if(!(window.name||'').includes(this.TAB_PAID))window.name=(window.name||'')+this.TAB_PAID}catch(_){}
    this._refreshSupportButton();
  },

  hasAutoShown(){
    let tab='';
    try{tab=window.name||''}catch(_){}
    return !!(
      this._safeGet(this._localStore(),this.AUTO_KEY) ||
      this._safeGet(this._sessionStore(),this.AUTO_KEY) ||
      this._getCookie(this.AUTO_COOKIE_KEY) ||
      tab.includes(this.TAB_AUTO)
    );
  },

  markAutoShown(){
    this._safeSet(this._localStore(),this.AUTO_KEY,'1');
    this._safeSet(this._sessionStore(),this.AUTO_KEY,'1');
    this._setCookie(this.AUTO_COOKIE_KEY,'1',365);
    try{if(!(window.name||'').includes(this.TAB_AUTO))window.name=(window.name||'')+this.TAB_AUTO}catch(_){}
  },

  _generateToken(){
    const ts=Date.now();
    const rand=Math.random().toString(36).substring(2,10);
    try{return btoa(`${ts}_${rand}_abc_studio`)}catch(_){return `${ts}_${rand}_abc_studio`}
  },

  _setCookie(name,value,days){
    try{
      const d=new Date();
      d.setTime(d.getTime()+days*24*60*60*1000);
      document.cookie=`${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    }catch(_){}
  },

  _getCookie(name){
    try{
      const prefix=name+'=';
      for(const part of document.cookie.split(';')){
        const c=part.trim();
        if(c.indexOf(prefix)===0)return c.substring(prefix.length);
      }
    }catch(_){}
    return '';
  },

  show(config){
    if(this.hasPaid()){
      this._showThanks('已经收到你的支持，谢谢。');
      return;
    }
    const cfg=Object.assign({},this.DEFAULT_CONFIG,config||{});
    this._lastFocus=document.activeElement;
    let overlay=document.getElementById('paywall-overlay');
    if(!overlay){
      this._createOverlay(cfg);
      overlay=document.getElementById('paywall-overlay');
    }else{
      overlay.style.display='flex';
      overlay.classList.remove('paywall-closing','paywall-show');
      requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.classList.add('paywall-show')));
      setTimeout(()=>overlay.querySelector('[data-paywall-close]')?.focus(),20);
    }
    document.documentElement.classList.add('paywall-open');
  },

  hide(){
    const overlay=document.getElementById('paywall-overlay');
    if(!overlay)return;
    overlay.classList.add('paywall-closing');
    overlay.classList.remove('paywall-show');
    document.documentElement.classList.remove('paywall-open');
    setTimeout(()=>{
      overlay.style.display='none';
      overlay.classList.remove('paywall-closing');
      try{this._lastFocus?.focus()}catch(_){}
    },400);
  },

  _onSupport(){
    this.markPaid();
    this.hide();
    this._showThanks('感谢你的支持！这份公开资料会继续留在这里。');
  },

  _showThanks(message){
    document.querySelectorAll('.paywall-toast').forEach(x=>x.remove());
    const toast=document.createElement('div');
    toast.className='paywall-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.textContent=message||'感谢你的支持！';
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('show'),50);
    setTimeout(()=>{
      toast.classList.remove('show');
      setTimeout(()=>toast.remove(),400);
    },3000);
  },

  _animateIn(){
    const overlay=document.getElementById('paywall-overlay');
    if(overlay)requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.classList.add('paywall-show')));
  },

  _createOverlay(cfg){
    const html=`
      <div class="paywall-overlay" id="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title-text">
        <div class="paywall-card">
          <button class="paywall-close" type="button" data-paywall-close title="关闭" aria-label="关闭支持作者弹窗">&times;</button>
          <div class="paywall-card-inner">
            <div class="paywall-header">
              <div class="paywall-title-row">
                <span class="paywall-heart" aria-hidden="true">♡</span>
                <span class="paywall-title" id="paywall-title-text">${cfg.title}</span>
                <span class="paywall-heart" aria-hidden="true">♡</span>
              </div>
              <div class="paywall-subtitle">${cfg.price} 自愿打赏 · 感谢支持</div>
            </div>
            <div class="paywall-body">
              <div class="paywall-qr-wrapper">
                <img src="${cfg.qrCode}" alt="abc studio 一元收款码" class="paywall-qr-img" />
                <div class="paywall-qr-glow" aria-hidden="true"></div>
                <div class="paywall-qr-fallback" hidden>收款码暂时没有加载出来，请稍后再试。</div>
              </div>
              <div class="paywall-qr-tip">请用 <strong>某宝</strong> 扫码打赏 ${cfg.price}</div>
              <div class="paywall-message">
                <p class="paywall-msg-warm">你好，我是 ${cfg.studio} 的独立开发者。</p>
                <p class="paywall-msg-body">《五还》的网页、旧刊、人物记录和声音材料都反复改过很多遍。<br>如果这段调查让你愿意多停留一会儿，也可以用 <strong>${cfg.price}</strong> 支持我继续做下一部作品。</p>
                <p class="paywall-msg-cute">不支持也不会影响任何剧情、页面或结局，关掉这里就能继续完整阅览。</p>
                <p class="paywall-msg-warm2">谢谢你愿意把时间留给这些普通人的旧记录。</p>
              </div>
            </div>
            <div class="paywall-footer">
              <div class="paywall-hint"><span class="paywall-hint-icon" aria-hidden="true">💡</span><span>请勿清除浏览器数据，否则下次打开可能会再次看到这里。</span></div>
              <div class="paywall-btns">
                <button class="paywall-btn paywall-btn-support" type="button" data-paywall-supported>已完成支持 ♡</button>
                <button class="paywall-btn paywall-btn-later" type="button" data-paywall-later>下次一定</button>
              </div>
            </div>
            <div class="paywall-studio">${cfg.studio}</div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend',html);
    const overlay=document.getElementById('paywall-overlay');
    const img=overlay.querySelector('.paywall-qr-img');
    const fallback=overlay.querySelector('.paywall-qr-fallback');
    img?.addEventListener('error',()=>{img.hidden=true;if(fallback)fallback.hidden=false});
    overlay.querySelector('[data-paywall-close]')?.addEventListener('click',()=>this.hide());
    overlay.querySelector('[data-paywall-later]')?.addEventListener('click',()=>this.hide());
    overlay.querySelector('[data-paywall-supported]')?.addEventListener('click',()=>this._onSupport());
    overlay.addEventListener('click',e=>{if(e.target===overlay)this.hide()});
    overlay.addEventListener('keydown',e=>{
      if(e.key!=='Tab')return;
      const focusable=[...overlay.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden&&el.offsetParent!==null);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    });
    this._animateIn();
    setTimeout(()=>overlay.querySelector('[data-paywall-close]')?.focus(),20);
  },

  _pageName(){return (location.pathname.split('/').pop()||'index.html').toLowerCase()},
  _gameGet(key){return this._safeGet(this._localStore(),'wuhuan:'+key)},

  _isTriggerPoint(){
    const page=this._pageName();
    // 正常流程：陈素琴卷读完，进入梁伟卷时弹出。此时玩家已经建立人物层面的投入，
    // 又尚未进入中后段制度/旧刊调查，不会太早，也不会打断第一次解谜动作。
    if(page==='liang.html' && this._gameGet('chen')==='1')return true;
    // 旧存档/非常规跳转兜底：若梁伟卷已完成，则最迟在来访须知出现一次。
    if(page==='visit.html' && this._gameGet('liang')==='1')return true;
    return false;
  },

  _ensureSupportButton(){
    if(this._pageName()==='index.html')return;
    let btn=document.getElementById('support-author-fixed');
    if(!btn){
      btn=document.createElement('button');
      btn.id='support-author-fixed';
      btn.className='support-author-fixed';
      btn.type='button';
      btn.textContent='￥';
      btn.title='支持作者 1元';
      btn.setAttribute('aria-label','支持作者1元');
      btn.addEventListener('click',()=>this.show());
      document.body.appendChild(btn);
    }
    btn.classList.toggle('beside-music',!!document.getElementById('music-toggle'));
    btn.classList.toggle('on-final-page',this._pageName()==='final.html');
    this._refreshSupportButton();
  },

  _refreshSupportButton(){
    const btn=document.getElementById('support-author-fixed');
    if(!btn)return;
    const paid=this.hasPaid();
    btn.classList.toggle('supported',paid);
    btn.textContent='￥';
    btn.title=paid?'已支持作者 · 点击查看':'支持作者 1元';
    btn.setAttribute('aria-label',paid?'已支持作者，点击查看':'支持作者1元');
  },

  init(){
    if(this._pageName()==='index.html')return;
    this._ensureSupportButton();
    if(!this.hasPaid()&&!this.hasAutoShown()&&this._isTriggerPoint()){
      this.markAutoShown();
      clearTimeout(this._autoTimer);
      this._autoTimer=setTimeout(()=>this.show(),900);
    }
  }
};

window.Paywall=Paywall;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('paywall-overlay')?.style.display!=='none')Paywall.hide()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>Paywall.init(),{once:true});
else Paywall.init();
})();
