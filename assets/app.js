(function(){
  var root=document.documentElement, body=document.body;
  var R=body.dataset.root||'';
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}}

  // 頂欄高度（手機版會換行）給黏性元素共用
  var navEl=$('.nav');
  function syncNav(){root.style.setProperty('--navh',navEl.offsetHeight+'px')}
  syncNav();window.addEventListener('resize',syncNav);

  // 深淺色
  $('#dk').onclick=function(){
    var dark=root.getAttribute('data-theme')==='dark'||(!root.getAttribute('data-theme')&&window.matchMedia('(prefers-color-scheme:dark)').matches);
    var d=dark?'light':'dark';root.setAttribute('data-theme',d);store('pk-theme',d);
  };

  // 側欄：桌面固定顯示；手機是抽屜（有遮罩，點外面或按 Esc 關閉）
  var side=$('#side'),scrim=$('#scrim'),menu=$('#menuBtn'),mq=window.matchMedia('(max-width:900px)');
  function closeDrawer(){if(!side)return;side.classList.remove('open');scrim.hidden=true;body.classList.remove('drawer')}
  function applySide(){if(side&&!mq.matches)closeDrawer()}
  if(side){
    applySide();
    menu.onclick=function(){
      var open=!side.classList.contains('open');
      side.classList.toggle('open',open);scrim.hidden=!open;body.classList.toggle('drawer',open);
    };
    scrim.onclick=closeDrawer;
    side.addEventListener('click',function(e){if(e.target.closest('a')&&mq.matches)closeDrawer()});
    if(mq.addEventListener)mq.addEventListener('change',applySide);

    // 展開的抽屜換頁後維持原樣（還原在頁面的行內腳本，這裡負責記錄）
    function saveOpen(){store('pk-open',JSON.stringify($$('details[open]',side).map(function(d){return d.dataset.k}).filter(Boolean)))}
    $$('details',side).forEach(function(d){d.addEventListener('toggle',saveOpen)});
    // 側欄捲動位置也維持原樣；目前頁面不在可視範圍時才捲過去
    var curLink=$('a.cur',side);
    try{var st=sessionStorage.getItem('pk-side-top');if(st)side.scrollTop=+st}catch(e){}
    if(curLink){
      var a=curLink.getBoundingClientRect(),b=side.getBoundingClientRect();
      if(a.top<b.top||a.bottom>b.bottom)side.scrollTop+=a.top-b.top-b.height/3;
    }
    side.addEventListener('scroll',function(){try{sessionStorage.setItem('pk-side-top',side.scrollTop)}catch(e){}},{passive:true});
    // 閱讀到哪一小節，側欄就跟著標示
    var spyLinks=curLink?$$('a.sub',curLink.closest('details')||side).filter(function(l){return l.pathname===location.pathname}):[];
    if(spyLinks.length&&window.IntersectionObserver){
      var map={};spyLinks.forEach(function(l){map[l.hash.slice(1)]=l});
      var mark=function(l){
        spyLinks.forEach(function(x){x.classList.toggle('spy',x===l)});
        if(l){var r=l.getBoundingClientRect(),s=side.getBoundingClientRect();if(r.top<s.top+40||r.bottom>s.bottom-40)side.scrollTop+=r.top-s.top-s.height/2}
      };
      var obs=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting&&map[e.target.id])mark(map[e.target.id])});
      },{rootMargin:'-70px 0px -70% 0px'});
      Object.keys(map).forEach(function(id){var h=document.getElementById(id);if(h)obs.observe(h)});
    }
  }

  // 中英對照
  var bi=$('#bi');
  function setBi(on){body.classList.toggle('bi',on);bi.classList.toggle('on',on);bi.setAttribute('aria-pressed',on?'true':'false');store('pk-bi',on?'1':'0')}
  bi.onclick=function(){setBi(!body.classList.contains('bi'))};
  if(store('pk-bi')==='1') setBi(true);
  // 資料頁本來就列出英文名，這裡只有規則內文需要術語標註
  var isRules=body.classList.contains('k-rules');
  if(!isRules&&!body.classList.contains('k-data'))bi.hidden=true;

  // 術語註解：每個小節第一次出現時標註，避免滿版虛線
  var G=(window.GLOSS||[]).filter(function(g){return g.zh&&g.zh.length>=2&&g.en});
  var byZh={};G.forEach(function(g){if(!g.nowrap&&!byZh[g.zh])byZh[g.zh]=g.en});
  var zhs=Object.keys(byZh).sort(function(a,b){return b.length-a.length});
  function reEsc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  if(zhs.length&&isRules){
    var rx=new RegExp(zhs.map(reEsc).join('|'),'g'),seen={};
    $$('#content h2,#content h3,#content h4,#content h5,#content p,#content li,#content td,#content th').forEach(function(p){
      if(/^H[2-5]$/.test(p.tagName)&&!p.closest('.pn')){seen={};return}
      if(p.closest('.pn,.card'))return;
      var walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT,null),nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(function(n){
        if(n.parentNode.closest('abbr,a,h1,h2,h3,h4,h5'))return;
        var s=n.nodeValue,m,last=0,frag=null;rx.lastIndex=0;
        while((m=rx.exec(s))){
          if(seen[m[0]])continue;seen[m[0]]=1;
          if(!frag)frag=document.createDocumentFragment();
          frag.appendChild(document.createTextNode(s.slice(last,m.index)));
          var a=document.createElement('abbr');a.className='g';a.dataset.en=byZh[m[0]];a.tabIndex=0;a.textContent=m[0];
          frag.appendChild(a);last=m.index+m[0].length;
        }
        if(frag){frag.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(frag,n)}
      });
    });
    // 術語提示：滑鼠移上去或手機點一下都能看
    var tip=document.createElement('div');tip.id='gtip';tip.hidden=true;body.appendChild(tip);
    var showTip=function(el){
      tip.textContent=el.dataset.en;tip.hidden=false;
      var r=el.getBoundingClientRect(),w=tip.offsetWidth;
      tip.style.left=Math.max(8,Math.min(window.innerWidth-w-8,r.left+r.width/2-w/2))+'px';
      tip.style.top=(r.top-tip.offsetHeight-6+window.pageYOffset)+'px';
    };
    document.addEventListener('mouseover',function(e){var a=e.target.closest&&e.target.closest('abbr.g');if(a)showTip(a);else tip.hidden=true});
    document.addEventListener('focusin',function(e){if(e.target.matches&&e.target.matches('abbr.g'))showTip(e.target)});
    document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('abbr.g');if(a)showTip(a);else tip.hidden=true});
    window.addEventListener('scroll',function(){tip.hidden=true},{passive:true});
  }

  // 全站搜尋
  var IDX=window.SEARCH||[], q=$('#q'), box=$('#results'), timer, sel=-1;
  var enMap={};G.forEach(function(g){var k=g.en.toLowerCase();(enMap[k]=enMap[k]||[]).push(g.zh)});
  function terms(s){
    var out=[];s.trim().toLowerCase().split(/\s+/).filter(Boolean).forEach(function(t){
      var alt=[t];
      Object.keys(enMap).forEach(function(k){if(k===t||(t.length>=4&&k.indexOf(t)>-1))alt=alt.concat(enMap[k])});
      out.push(alt);
    });
    return out;
  }
  function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function snip(x,ts){
    var low=x.toLowerCase(),pos=-1;
    for(var i=0;i<ts.length&&pos<0;i++)for(var j=0;j<ts[i].length;j++){var p=low.indexOf(ts[i][j].toLowerCase());if(p>-1){pos=p;break}}
    if(pos<0)pos=0;
    var a=Math.max(0,pos-30),b=Math.min(x.length,pos+110);
    var t=escH((a?'…':'')+x.slice(a,b)+(b<x.length?'…':''));
    var all=[];ts.forEach(function(g){g.forEach(function(w){all.push(reEsc(escH(w)))})});
    return t.replace(new RegExp('('+all.join('|')+')','gi'),'<mark>$1</mark>');
  }
  // 標題符合優先於內文符合，完全相同的名稱排最前面
  function score(e,ts){
    var h=e.h.toLowerCase(),x=e.x.toLowerCase(),sum=0;
    for(var i=0;i<ts.length;i++){
      var best=0;
      for(var j=0;j<ts[i].length;j++){
        var w=ts[i][j].toLowerCase(),v=0;
        if(h===w||h.indexOf(w+' ')===0||h.slice(-w.length-1)===' '+w)v=100;
        else if(h.indexOf(w)===0)v=60;
        else if(h.indexOf(w)>-1)v=40;
        else if(x.indexOf(w)>-1)v=5;
        if(v>best)best=v;
      }
      if(!best)return 0;
      sum+=best;
    }
    return sum;
  }
  function setSel(i){
    var items=$$('a',box);if(!items.length)return;
    sel=(i+items.length)%items.length;
    items.forEach(function(a,k){a.classList.toggle('sel',k===sel)});
    items[sel].scrollIntoView({block:'nearest'});
  }
  function run(){
    var s=q.value.trim();sel=-1;
    if(!s){box.hidden=true;return}
    var ts=terms(s),res=[];
    IDX.forEach(function(e,i){var v=score(e,ts);if(v)res.push({e:e,v:v,i:i})});
    res.sort(function(a,b){return b.v-a.v||a.i-b.i});
    var total=res.length;res=res.slice(0,40);
    box.innerHTML=res.length?'<div class="n">找到 '+total+' 筆'+(total>40?'，只顯示最相關的 40 筆':'')+'（↑↓ 選擇，Enter 開啟）</div>'+res.map(function(r){
      var e=r.e,isData=e.p.indexOf('data/')===0;
      var qs=isData?'':'?q='+encodeURIComponent(s);
      return '<a href="'+R+e.p+qs+(e.a?'#'+e.a:'')+'"><div class="t"><span class="c">'+escH(e.c)+'</span>'+escH(e.h)+'</div><div class="s">'+snip(e.x,ts)+'</div></a>';
    }).join(''):'<div class="n">找不到「'+escH(s)+'」。試試換個關鍵字，或輸入英文。</div>';
    box.hidden=false;box.scrollTop=0;
  }
  q.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(run,120)});
  q.addEventListener('focus',function(){if(q.value.trim())run()});
  q.addEventListener('keydown',function(e){
    if(box.hidden)return;
    if(e.key==='ArrowDown'){e.preventDefault();setSel(sel+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();setSel(sel-1)}
    else if(e.key==='Enter'){var items=$$('a',box),t=items[sel<0?0:sel];if(t){e.preventDefault();location.href=t.href}}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement!==q&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();q.focus();q.select()}
    if(e.key==='Escape'){box.hidden=true;closeDrawer();if(document.activeElement===q)q.blur()}
  });
  document.addEventListener('click',function(e){if(!box.contains(e.target)&&e.target!==q)box.hidden=true});

  // 從搜尋結果進入：標示關鍵字
  var m=location.search.match(/[?&]q=([^&]+)/);
  if(m&&isRules){
    var s=decodeURIComponent(m[1]);q.value=s;
    var ts=terms(s),all=[];ts.forEach(function(g){g.forEach(function(w){all.push(reEsc(w))})});
    var rx2=new RegExp('('+all.join('|')+')','gi'),first=null;
    var w2=document.createTreeWalker($('#content'),NodeFilter.SHOW_TEXT,null),ns=[];
    while(w2.nextNode())ns.push(w2.currentNode);
    ns.forEach(function(n){
      if(n.parentNode.closest('mark,script,.pn'))return;
      if(!rx2.test(n.nodeValue)){rx2.lastIndex=0;return}rx2.lastIndex=0;
      var sp=document.createElement('span');
      sp.innerHTML=escH(n.nodeValue).replace(rx2,'<mark>$1</mark>');
      n.parentNode.replaceChild(sp,n);
      if(!first)first=sp.querySelector('mark');
    });
    if(first&&!location.hash)first.scrollIntoView({block:'center'});
  }

  // 回到頂端
  var top=document.createElement('button');
  top.id='toTop';top.type='button';top.textContent='↑';top.title='回到頂端';top.setAttribute('aria-label','回到頂端');top.hidden=true;body.appendChild(top);
  top.onclick=function(){window.scrollTo({top:0,behavior:'smooth'})};
  window.addEventListener('scroll',function(){top.hidden=window.pageYOffset<500},{passive:true});
})();
