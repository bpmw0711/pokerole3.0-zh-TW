// 隨機產生器：資料在 generator-data.js（由 tools/build_data.py 產生），這支是手寫的互動程式。
(function(){
var G=window.GEN,D=G.dex,MV=G.moves,AB=G.abilities,NA=G.natures,CH=G.chart,TC=G.typeColor,INK=G.typeInk,RZ=G.rankZh,SZ=G.statZh,GZ=G.genZh;
var IMG='../assets/art/';
var SOC=['強壯','帥氣','美麗','聰明','可愛'];
var SKG=[['戰鬥類',['鬥毆','導引','對抗','閃避']],['生存類',['警覺','運動','自然','隱匿']],['社交類',['魅惑','禮儀','威嚇','表演']]];
var SK=[];SKG.forEach(function(g){SK=SK.concat(g[1])});
var SI={};SK.forEach(function(n,i){SI[n]=i});
// 階級表：能力值、社交、技能點數、技能上限、目標上限（系統說明・階級）
var RANK={1:[0,0,5,1,1],2:[2,2,10,2,2],3:[4,4,14,3,3],4:[6,6,17,4,4],5:[8,8,19,5,5],6:[10,10,20,5,6],7:[10,10,22,5,8],8:[14,14,25,5,10]};
var STYW={phys:[5,3,2,.3,1],spec:[.3,3,2,5,2],tank:[1,1,5,1,5],sup:[.5,2,2,1,5]};
var SOC_CAP=5,FREE_MAX=12;
function $(i){return document.getElementById(i)}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function pad(n){return n?'#'+String(n).padStart(3,'0'):''}
function chip(t){return '<span class="tag" style="background:'+(TC[t]||'#888')+';color:'+(INK[t]||'#fff')+'">'+t+'</span>'}
function pickW(c,w){var t=0,i;for(i=0;i<c.length;i++)t+=w[i];var r=Math.random()*t;for(i=0;i<c.length;i++){r-=w[i];if(r<0)return c[i]}return c[c.length-1]}

// ---------- 規則 ----------
function isFull(x){return x.st.every(function(a){return a[0]>=a[1]})}// 圖鑑能力值全滿：視為傳說或幻之，沒有能力值上限
function capOf(x,k,rank){return isFull(x)?Infinity:x.st[k][1]+(rank===8?2:0)}
function bonus(s){return s.rank===7?3:0}// 大師級：HP、意志、先攻、防禦與特防 +3
function dice(s){return s.rank===7?2:0}// 大師級：涉及技能的擲骰 +2 顆骰
function will(s){return s.st[4]+3+bonus(s)}
function hp(s,x){return (x.hp||0)+s.st[2]+bonus(s)}
function slots(s){return s.st[4]+3}
function spent(s,g,x){
 if(g==='st')return s.st.reduce(function(n,v,k){return n+v-x.st[k][0]},0);
 if(g==='so')return s.so.reduce(function(n,v){return n+v-1},0);
 return s.sk.reduce(function(n,v){return n+v},0)}
function budget(s,g){return RANK[s.rank][g==='st'?0:g==='so'?1:2]}
function maxOf(s,g,k,x){if(s.free)return FREE_MAX;return g==='st'?capOf(x,k,s.rank):g==='so'?SOC_CAP:RANK[s.rank][3]}
function minOf(s,g,k,x){if(s.free)return 0;return g==='st'?x.st[k][0]:g==='so'?1:0}
function alloc(v,cap,w,pts){v=v.slice();
 while(pts>0){var c=[],cw=[];v.forEach(function(n,i){if(n<cap[i]&&w[i]>0){c.push(i);cw.push(w[i])}});if(!c.length)break;v[pickW(c,cw)]++;pts--}
 return v}

// ---------- 招式 ----------
function parts(a){var o={st:[],sk:[]},ok=true;String(a||'').split('+').forEach(function(sd){sd.split('/').forEach(function(t){t=t.trim();
  if(!t)return;if(SI[t]!=null)o.sk.push(t);else if(SZ.indexOf(t)>-1||SOC.indexOf(t)>-1||t==='意志')o.st.push(t);else ok=false})});return ok&&(o.st.length||o.sk.length)?o:null}
function statVal(s,t){var i=SZ.indexOf(t);if(i>-1)return s.st[i];i=SOC.indexOf(t);if(i>-1)return s.so[i];return t==='意志'?will(s):0}
function maxBy(a,f){return a.reduce(function(m,t){return Math.max(m,f(t))},0)}
function hitPool(s,m){var p=parts(m.a);if(!p)return null;
 return maxBy(p.st,function(t){return statVal(s,t)})+maxBy(p.sk,function(t){return s.sk[SI[t]]})+(p.sk.length?dice(s):0)}
function dmgPool(s,m,x){var r=String(m.d||'').match(/^([^+]+?)\s*\+\s*(\d+)/);if(!r)return null;
 var ts=r[1].split('/').map(function(t){return t.trim()});if(!ts.every(function(t){return SZ.indexOf(t)>-1}))return null;
 return maxBy(ts,function(t){return statVal(s,t)})+(+r[2])+(x.ty.indexOf(m.t)>-1&&m.c!=='變化'?1:0)}
function hasAny(x,rank){return x.mv.some(function(m){return !m.k&&m.z==='任意招式'&&m.r<=rank})}
function pool(x,rank,mode){var seen={},out=[];
 function add(k){if(k&&MV[k]&&!seen[k]){seen[k]=1;out.push(k)}}
 if(mode==='all')Object.keys(MV).forEach(add);
 else{x.mv.forEach(function(m){if(mode==='dex'||m.r<=rank)add(m.k)});
  if(hasAny(x,mode==='dex'?8:rank))Object.keys(MV).forEach(function(k){if(MV[k].t!=='無')add(k)})}
 return out}
function repRank(x,k){for(var i=0;i<x.mv.length;i++)if(x.mv[i].k===k)return x.mv[i].r;return 0}
function mvWeight(k,x,st,style,rank){if(style==='random')return 1;
 var m=MV[k],atk=m.c!=='變化',w=1,r=repRank(x,k)||1;
 if(atk){w*=1.6;if(x.ty.indexOf(m.t)>-1)w*=2.2;w*=(m.c==='物理')===(st[0]>=st[3])?1.6:.6}
 if(style==='phys')w*=m.c==='物理'?2.5:m.c==='特殊'?.2:1;
 if(style==='spec')w*=m.c==='特殊'?2.5:m.c==='物理'?.2:1;
 if(style==='tank'&&!atk)w*=2.2;
 if(style==='sup')w*=atk?.5:3.5;
 return w*(1+r*.25)}
function pickMoves(x,s,n,keep){var taken=(keep||[]).filter(Boolean),c=pool(x,s.rank,'rank').filter(function(k){return taken.indexOf(k)<0}),out=taken.slice();
 while(out.length<n&&c.length){var k=pickW(c,c.map(function(y){return mvWeight(y,x,s.st,s.style,s.rank)}));out.push(k);c.splice(c.indexOf(k),1)}
 // 除了完全隨機與輔助，至少帶一招會造成傷害的招式
 if(s.style!=='random'&&s.style!=='sup'&&!(keep&&keep.length)&&out.length&&!out.some(function(k){return MV[k].c!=='變化'})){
  var a=c.filter(function(k){return MV[k].c!=='變化'});if(a.length)out[out.length-1]=rnd(a)}
 return out}

// ---------- 產生 ----------
function rollStats(x,s){var w;
 if(s.style==='random')w=[1,1,1,1,1];else if(s.style==='species')w=x.st.map(function(a){return a[1]*a[1]});else w=STYW[s.style];
 return alloc(x.st.map(function(a){return a[0]}),x.st.map(function(a,k){return capOf(x,k,s.rank)}),w,RANK[s.rank][0])}
function rollSocial(s){return alloc([1,1,1,1,1],[5,5,5,5,5],[1,1,1,1,1],RANK[s.rank][1])}
function rollSkills(s){var w=SK.map(function(){return 1});
 if(s.style!=='random'){s.mv.slice(0,slots(s)).forEach(function(k){var p=parts(MV[k]&&MV[k].a);if(p&&p.sk.length){p.sk.forEach(function(t){w[SI[t]]+=4/p.sk.length})}});
  w[SI['閃避']]+=2;w[SI['對抗']]+=2;w[SI['警覺']]+=1}
 return alloc(SK.map(function(){return 0}),SK.map(function(){return RANK[s.rank][3]}),w,RANK[s.rank][2])}
function abName(a){return a.n.replace(/ \(Hidden\)/,'')}
function roll(x,rank,style){
 var s={i:x.i,rank:rank,style:style,nick:'',item:'',note:'',hap:2,loy:2,free:false,mode:'rank'};
 s.st=rollStats(x,s);s.so=rollSocial(s);s.mv=pickMoves(x,s,slots(s));s.sk=rollSkills(s);
 s.ab=abName(rnd(x.ab));s.na=rnd(NA).n;return s}

// ---------- 條件面板 ----------
var q=$('gq'),ft=$('gt'),ft2=$('gt2'),fg=$('gg'),fr=$('gr'),fs=$('gs'),fl=$('gl'),sp=$('gsp'),rk=$('grk'),sty=$('gsty'),L=D;
function match(x){
 if(ft.value&&x.ty.indexOf(ft.value)<0)return false;
 if(ft2.value==='-'){if(x.ty.length!==1)return false}else if(ft2.value&&x.ty.indexOf(ft2.value)<0)return false;
 if(fg.value&&String(x.g)!==fg.value)return false;
 if(fr.value&&String(x.rk)!==fr.value)return false;
 if(fs.value&&x.stage!==fs.value)return false;
 var l=fl.value,me=x.stage==='超級進化';
 if((l==='noleg'&&x.leg)||(l==='leg'&&!x.leg)||(l==='nomega'&&me)||(l==='plain'&&(x.leg||me)))return false;
 var t=q.value.trim().toLowerCase();if(!t)return true;
 var hay=(x.n+' '+x.z+' #'+x.num+' '+pad(x.num)+' '+x.ty.join(' ')+' '+x.ab.map(function(a){return a.n+' '+a.z}).join(' ')+' '+x.mv.map(function(m){return m.n+' '+m.z}).join(' ')).toLowerCase();
 return t.split(/\s+/).every(function(w){return hay.indexOf(w)>-1})}
function refilter(){var keep=sp.value;L=D.filter(match);
 $('gcnt').textContent='符合 '+L.length+' / '+D.length+' 筆';
 $('greset').hidden=!(q.value||ft.value||ft2.value||fg.value||fr.value||fs.value||fl.value);
 sp.innerHTML='<option value="">隨機（從符合的 '+L.length+' 筆中抽選）</option>'+L.map(function(x){return '<option value="'+x.i+'">'+pad(x.num)+' '+esc(x.z||x.n)+'</option>'}).join('');
 if(keep&&L.some(function(x){return String(x.i)===keep}))sp.value=keep;
 $('ggo').disabled=!L.length}

// ---------- 角色卡 ----------
var cur=null,hist=[],sheet=$('gsheet');
function pips(base,val,cap){var h='',b=Math.min(base,val),n=isFinite(cap)?Math.max(cap,val):val;
 for(var i=0;i<n;i++)h+='<i class="'+(i<b?'b':i<val?'a':'')+'"></i>';return '<span class="pips" aria-hidden="true">'+h+'</span>'}
function stepBtn(g,k,d,on){return '<button type="button" class="gb" data-a="step" data-g="'+g+'" data-k="'+k+'" data-d="'+d+'" data-fid="'+g+k+d+'"'+(on?'':' disabled')+' aria-label="'+(d>0?'增加':'減少')+'">'+(d>0?'+':'−')+'</button>'}
function row(s,g,k,name,base,val,cap,x,suffix){
 var rem=budget(s,g)-spent(s,g,x),over=!s.free&&val>cap;
 var inc=s.free?val<FREE_MAX:(val<cap&&rem>0),dec=val>minOf(s,g,k,x);
 return '<div class="gr'+(over?' over':'')+'"><span class="sd-n">'+name+'</span>'+pips(base,val,cap)+'<span class="sd-v">'+val+(suffix||'')+'</span>'+stepBtn(g,k,-1,dec)+stepBtn(g,k,1,inc)+'</div>'}
function remark(s,g,x){var r=budget(s,g)-spent(s,g,x);
 if(s.free)return '<small>已用 '+spent(s,g,x)+' 點（階級 '+budget(s,g)+' 點）</small>';
 return r<0?'<small class="warn">超出 '+(-r)+' 點</small>':'<small'+(r>0?' class="left"':'')+'>剩餘 '+r+' ／ 共 '+budget(s,g)+' 點</small>'}
function rrBtn(w,t){return '<button type="button" class="clear rr" data-a="rr" data-w="'+w+'" data-fid="rr'+w+'">'+(t||'重新隨機')+'</button>'}
function fld(l,h){return '<label class="gfld"><span>'+l+'</span>'+h+'</label>'}
function opt(v,t,sel){return '<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+esc(t)+'</option>'}
function counter(f,val,lab){return '<div class="gfld"><span>'+lab+'</span><div class="gcnt2"><button type="button" class="gb" data-a="cnt" data-f="'+f+'" data-d="-1" data-fid="'+f+'-1"'+(val<=0?' disabled':'')+' aria-label="減少">−</button><b>'+val+'</b><button type="button" class="gb" data-a="cnt" data-f="'+f+'" data-d="1" data-fid="'+f+'1"'+(val>=5?' disabled':'')+' aria-label="增加">+</button></div></div>'}
function matchup(x){var w=[],r=[],im=[];Object.keys(CH).forEach(function(t){var n=0,imm=false;x.ty.forEach(function(d){var c=CH[d];if(!c)return;if(c.i.indexOf(t)>-1)imm=true;else if(c.w.indexOf(t)>-1)n++;else if(c.r.indexOf(t)>-1)n--});
  if(imm)im.push(t);else if(n>0)w.push([t,n]);else if(n<0)r.push([t,n])});return {w:w,r:r,i:im}}
function mxChips(a){return a.map(function(t){var n=t[0]?t:[t,1],l=Math.abs(n[1]);return '<span class="gmx">'+chip(n[0])+(l>1?'<b>×'+l+'</b>':'')+'</span>'}).join('')}
function moveOptions(s,x,idx){var own=s.mv[idx]||'',others=s.mv.slice(0,slots(s)).filter(function(k,i){return i!==idx&&k}),c=pool(x,s.rank,s.mode).filter(function(k){return others.indexOf(k)<0});
 var h=opt('','（未選擇）',!own);
 if(own&&c.indexOf(own)<0)h+=opt(own,(MV[own]?MV[own].z||own:own)+'（超出階級）',true);
 var gs={},order=[];
 c.forEach(function(k){var r=repRank(x,k),g=s.mode==='all'||(!r)?MV[k].t+'屬性':(RZ[r]||'未標示階級');if(!gs[g]){gs[g]=[];order.push(g)}gs[g].push(k)});
 order.forEach(function(g){h+='<optgroup label="'+esc(g)+'">'+gs[g].map(function(k){return opt(k,(MV[k].z||k),k===own)}).join('')+'</optgroup>'});
 return h}
function moveRow(s,x,i){var k=s.mv[i]||'',m=MV[k],h='';
 var late=m&&s.mode==='rank'&&pool(x,s.rank,'rank').indexOf(k)<0;
 h+='<div class="gm'+(late?' over':'')+'"><div class="gm1"><span class="gmn">'+(i+1)+'</span><select aria-label="第 '+(i+1)+' 招" data-m="'+i+'" data-fid="m'+i+'">'+moveOptions(s,x,i)+'</select><button type="button" class="gb" data-a="rm" data-m="'+i+'" data-fid="rm'+i+'" title="只重新抽這一招" aria-label="重新抽這一招">↻</button></div>';
 if(m){var hp_=hitPool(s,m),dp=dmgPool(s,m,x),st=x.ty.indexOf(m.t)>-1&&m.c!=='變化';
  h+='<div class="gm2">'+chip(m.t)+'<span>'+esc(m.c)+'</span>'+(m.p&&m.p!=='—'?'<span>威力 '+esc(m.p)+'</span>':'')+
   '<span>命中 '+esc(m.a||'—')+(hp_!=null?' = <b>'+hp_+'</b> 骰':'')+'</span>'+
   (m.d&&m.d!=='-'?'<span>傷害 '+esc(m.d)+(dp!=null?' = <b>'+dp+'</b> 骰'+(st?'（含屬性一致）':''):'')+'</span>':'')+
   '<a href="moves.html?n='+encodeURIComponent(k)+'">招式資料</a>'+(late?'<em class="warn">超出目前階級</em>':'')+'</div>'+
   (m.e?'<p class="ge">'+esc(m.e)+'</p>':'')}
 return h+'</div>'}
function render(){var s=cur;if(!s)return;var x=D[s.i],c=TC[x.ty[0]]||'#888',c2=TC[x.ty[1]]||c;
 var ae=document.activeElement,fid=ae&&ae.dataset?ae.dataset.fid:null;
 var nature=NA.filter(function(n){return n.n===s.na})[0],ab=AB[s.ab];
 var dex=s.st[1],mx=matchup(x),n=slots(s),rkv=RANK[s.rank],bo=bonus(s),dc=dice(s);
 var abs=x.ab.map(abName),rest=Object.keys(AB).filter(function(k){return abs.indexOf(k)<0}).sort(function(a,b){return (AB[a].z||a).localeCompare(AB[b].z||b,'zh-Hant')});
 var abOpts='<optgroup label="這隻寶可夢的特性">'+abs.map(function(k){return opt(k,(AB[k]&&AB[k].z)||k,k===s.ab)}).join('')+'</optgroup><optgroup label="其他特性（隱藏特性，需與說書人討論）">'+rest.map(function(k){return opt(k,AB[k].z||k,k===s.ab)}).join('')+'</optgroup>';
 var fact=function(k,v){return '<div class="fact"><span>'+k+'</span><b>'+v+'</b></div>'};
 var clashP=Math.max(s.st[0],s.st[3])+s.sk[SI['對抗']]+dc;
 var h='<div class="gtool"><button type="button" class="clear" data-a="copy">複製文字</button><button type="button" class="clear" data-a="link">複製連結</button><button type="button" class="clear" data-a="print">列印</button><label class="gfree"><input type="checkbox" data-f="free"'+(s.free?' checked':'')+'> 不受規則限制</label><span class="gmsg" id="gmsg" role="status"></span></div>';
 h+='<div class="dhero" style="--tc:'+c+';--tc2:'+c2+'"><div class="dimg">'+(x.img?'<img alt="'+esc(x.z||x.n)+'" src="'+IMG+x.img+'.png" onerror="this.style.display=\'none\'">':'')+'</div><div class="dtitle"><small>'+pad(x.num)+(x.g?'・'+GZ[x.g].replace(/（.*/,''):'')+'</small><h2>'+esc(s.nick||x.z||x.n)+'</h2><small>'+(s.nick?esc(x.z||x.n)+'・':'')+esc(x.n)+'</small><div class="tags">'+x.ty.map(chip).join('')+'</div></div></div>';
 h+='<div class="gcols"><section class="dsec"><h3>基本資料</h3><div class="gform">'+
  fld('暱稱','<input data-f="nick" value="'+esc(s.nick)+'" placeholder="（沒有）" data-fid="nick">')+
  fld('階級','<select data-f="rank" data-fid="rank">'+Object.keys(RZ).map(function(r){return opt(r,RZ[r],+r===s.rank)}).join('')+'</select>')+
  fld('性格','<span class="grr"><select data-f="na" data-fid="na">'+NA.map(function(o){return opt(o.n,o.n,o.n===s.na)}).join('')+'</select><button type="button" class="gb" data-a="rr" data-w="na" data-fid="rrna" title="重新抽性格" aria-label="重新抽性格">↻</button></span>')+
  fld('特性','<span class="grr"><select data-f="ab" data-fid="ab">'+abOpts+'</select><button type="button" class="gb" data-a="rr" data-w="ab" data-fid="rrab" title="重新抽特性" aria-label="重新抽特性">↻</button></span>')+
  fld('攜帶道具','<input data-f="item" value="'+esc(s.item)+'" placeholder="（沒有）" data-fid="item">')+
  '<div class="gpair">'+counter('hap',s.hap,'幸福度')+counter('loy',s.loy,'忠誠度')+'</div></div>'+
  (nature?'<p class="ge"><b>'+esc(nature.n)+'</b>：'+esc(nature.k)+'。<a href="../rules/create-20.html">性格說明</a></p>':'')+
  (ab?'<p class="ge"><b>'+esc(ab.z||s.ab)+'</b>：'+esc(ab.e)+'</p>':'')+
  '<div class="facts gsmall">'+fact('建議階級',RZ[x.rk]||'—')+fact('進化階段',x.stage||'—')+fact('身高／體重',(x.h||'—')+' m／'+(x.w||'—')+' kg')+'</div></section>';
 h+='<section class="dsec"><h3>戰鬥數值'+(s.rank===7?'<small>含大師級 +3 與涉及技能的 +2 骰</small>':'')+'</h3><div class="facts gfacts">'+fact('HP',hp(s,x))+fact('意志',will(s))+fact('先攻值',dex+s.sk[SI['警覺']]+bo)+fact('防禦',s.st[2]+bo)+fact('特防',s.st[4]+bo)+fact('閃避骰池',dex+s.sk[SI['閃避']]+dc)+fact('對抗骰池',clashP)+fact('目標上限',rkv[4])+'</div>'+
  '<div class="gmxs">'+(mx.w.length?'<div><span>弱點</span>'+mxChips(mx.w)+'</div>':'')+(mx.r.length?'<div><span>抗性</span>'+mxChips(mx.r)+'</div>':'')+(mx.i.length?'<div><span>免疫</span>'+mxChips(mx.i)+'</div>':'')+'</div></section></div>';
 var full=isFull(x);
 h+='<div class="gcols"><section class="dsec"><h3>能力值'+remark(s,'st',x)+rrBtn('st')+'</h3>'+
  x.st.map(function(a,k){var cap=capOf(x,k,s.rank);return row(s,'st',k,SZ[k],a[0],s.st[k],cap,x,isFinite(cap)?' / '+cap:'')}).join('')+
  (full?'<p class="ge">圖鑑能力值全滿的寶可夢視為傳說或幻之寶可夢，沒有能力值上限，點數也可以不用完（<a href="../rules/spirit-4.html">傳說戰鬥</a>）。</p>':'')+
  (s.rank===8&&!full?'<p class="ge">冠軍級的能力值最高可超過上限 2 點，上限已經加上。</p>':'')+'</section>';
 h+='<section class="dsec"><h3>社交能力值'+remark(s,'so',x)+rrBtn('so')+'</h3>'+SOC.map(function(t,k){return row(s,'so',k,t,1,s.so[k],SOC_CAP,x,' / '+SOC_CAP)}).join('')+'</section></div>';
 h+='<section class="dsec"><h3>技能<small>上限 '+rkv[3]+'</small>'+remark(s,'sk',x)+rrBtn('sk')+'</h3><div class="gskills">'+SKG.map(function(g){return '<div><h5>'+g[0]+'</h5>'+g[1].map(function(t){var k=SI[t];return row(s,'sk',k,t,0,s.sk[k],s.free?Math.max(5,s.sk[k]):5,x)}).join('')+'</div>'}).join('')+'</div></section>';
 var avail=pool(x,s.rank,s.mode).length;
 h+='<section class="dsec"><h3>招式<small>可學 '+n+' 招（洞察 + 3）</small><select class="gmode" data-f="mode" data-fid="mode" aria-label="招式清單範圍">'+opt('rank','只列這個階級能學的',s.mode==='rank')+opt('dex','列出完整招式庫',s.mode==='dex')+opt('all','列出全部招式',s.mode==='all')+'</select>'+rrBtn('mv')+'</h3>';
 for(var i=0;i<n;i++)h+=moveRow(s,x,i);
 if(avail<n)h+='<p class="ge">這個範圍只有 '+avail+' 招可學，其餘欄位先留空。</p>';
 h+='</section><section class="dsec"><h3>備註</h3><textarea class="gnote" data-f="note" rows="2" data-fid="note" placeholder="訓練點數、戰鬥羈絆、飾品等，都可以記在這裡">'+esc(s.note)+'</textarea></section>';
 sheet.innerHTML=h;
 document.title=(s.nick||x.z||x.n)+' – 隨機產生器';
 if(fid){var el=sheet.querySelector('[data-fid="'+fid+'"]');if(el&&!el.disabled)el.focus({preventScroll:true})}
 saveHash()}

// ---------- 分享與輸出 ----------
function encode(s){return btoa(unescape(encodeURIComponent(JSON.stringify(s)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decode(t){try{return JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return null}}
function saveHash(){try{history.replaceState(null,'','#s='+encode(cur))}catch(e){}}
function valid(s){return s&&D[s.i]&&RANK[s.rank]&&Array.isArray(s.st)&&s.st.length===5&&Array.isArray(s.so)&&s.so.length===5&&Array.isArray(s.sk)&&s.sk.length===12&&Array.isArray(s.mv)}
function msg(t){var m=$('gmsg');if(m){m.textContent=t;setTimeout(function(){if(m)m.textContent=''},2200)}}
function copy(t,ok){function fb(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();var r=false;try{r=document.execCommand('copy')}catch(e){}a.remove();msg(r?ok:'無法複製，請手動選取')}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){msg(ok)},fb);else fb()}
function asText(){var s=cur,x=D[s.i],o=[],bo=bonus(s),dc=dice(s),ab=AB[s.ab];
 o.push((s.nick?s.nick+'（'+(x.z||x.n)+'）':(x.z||x.n))+' '+pad(x.num)+'　'+x.ty.join('/'));
 o.push('階級：'+RZ[s.rank]+'　性格：'+s.na+'　特性：'+((ab&&ab.z)||s.ab)+(s.item?'　道具：'+s.item:''));
 o.push('HP '+hp(s,x)+'　意志 '+will(s)+'　先攻值 '+(s.st[1]+s.sk[SI['警覺']]+bo)+'　防禦 '+(s.st[2]+bo)+'　特防 '+(s.st[4]+bo)+'　閃避 '+(s.st[1]+s.sk[SI['閃避']]+dc)+'　對抗 '+(Math.max(s.st[0],s.st[3])+s.sk[SI['對抗']]+dc));
 o.push('能力值：'+SZ.map(function(t,k){return t+' '+s.st[k]}).join('、'));
 o.push('社交：'+SOC.map(function(t,k){return t+' '+s.so[k]}).join('、'));
 o.push('技能：'+(SK.filter(function(t){return s.sk[SI[t]]>0}).map(function(t){return t+' '+s.sk[SI[t]]}).join('、')||'無'));
 o.push('幸福度 '+s.hap+'　忠誠度 '+s.loy);
 o.push('招式：');
 s.mv.slice(0,slots(s)).forEach(function(k){var m=MV[k];if(!m)return;var a=hitPool(s,m),d=dmgPool(s,m,x);
  o.push('・'+(m.z||k)+'（'+m.t+'／'+m.c+'）命中 '+(a!=null?a+' 骰':m.a)+(m.d&&m.d!=='-'?'，傷害 '+(d!=null?d+' 骰':m.d):''))});
 if(s.note)o.push('備註：'+s.note);
 return o.join('\n')}

// ---------- 事件 ----------
function generate(user){
 var x=sp.value!==''?D[+sp.value]:rnd(L);if(!x)return;
 var r=rk.value==='r'?1+Math.floor(Math.random()*8):rk.value?+rk.value:(x.rk||1);
 if(cur){hist.push(JSON.stringify(cur));if(hist.length>30)hist.shift()}
 cur=roll(x,r,sty.value);$('gback').disabled=!hist.length;render();
 if(user&&window.matchMedia('(max-width:980px)').matches)sheet.scrollIntoView({block:'start'})}
sheet.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||b.disabled||!cur)return;var s=cur,x=D[s.i],a=b.dataset.a;
 if(a==='step'){var arr=s[b.dataset.g],k=+b.dataset.k,d=+b.dataset.d;arr[k]+=d;render()}
 else if(a==='cnt'){s[b.dataset.f]=Math.max(0,Math.min(5,s[b.dataset.f]+(+b.dataset.d)));render()}
 else if(a==='rr'){var w=b.dataset.w;
  if(w==='st'){s.st=rollStats(x,s);s.mv=pickMoves(x,s,slots(s),s.mv.filter(Boolean).slice(0,slots(s)))}
  else if(w==='so')s.so=rollSocial(s);
  else if(w==='sk')s.sk=rollSkills(s);
  else if(w==='na')s.na=rnd(NA).n;
  else if(w==='ab')s.ab=abName(rnd(x.ab));
  else if(w==='mv')s.mv=pickMoves(x,s,slots(s));
  render()}
 else if(a==='rm'){var i=+b.dataset.m,others=s.mv.slice(0,slots(s)).filter(function(k,j){return j!==i&&k}),c=pool(x,s.rank,s.mode).filter(function(k){return others.indexOf(k)<0&&k!==s.mv[i]});
  if(c.length){s.mv[i]=pickW(c,c.map(function(y){return mvWeight(y,x,s.st,s.style,s.rank)}));render()}else msg('沒有其他招式可抽')}
 else if(a==='copy')copy(asText(),'已複製文字');
 else if(a==='link')copy(location.href,'已複製連結');
 else if(a==='print')window.print()});
sheet.addEventListener('input',function(e){var t=e.target,f=t.dataset.f;if(!cur||!f)return;
 if(f==='nick'||f==='item'||f==='note'){cur[f]=t.value;saveHash();if(f==='nick'){var h=sheet.querySelector('.dtitle h2'),x=D[cur.i];h.textContent=cur.nick||x.z||x.n}}});
sheet.addEventListener('change',function(e){var t=e.target,f=t.dataset.f;if(!cur)return;
 if(t.dataset.m!=null){cur.mv[+t.dataset.m]=t.value;render();return}
 if(!f)return;
 if(f==='rank'){cur.rank=+t.value;render()}
 else if(f==='na'||f==='ab'||f==='mode'){cur[f]=t.value;render()}
 else if(f==='free'){cur.free=t.checked;render()}
 else if(f==='nick'){render()}});
$('ggo').addEventListener('click',function(){generate(true)});
$('gback').addEventListener('click',function(){if(!hist.length)return;cur=JSON.parse(hist.pop());this.disabled=!hist.length;render()});
var timer;q.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(refilter,120)});
[ft,ft2,fg,fr,fs,fl].forEach(function(el){el.addEventListener('input',refilter)});
$('greset').addEventListener('click',function(){q.value=ft.value=ft2.value=fg.value=fr.value=fs.value=fl.value='';refilter();q.focus()});
var fbox=$('gf'),fold=$('gfold');
function setFold(on){fbox.classList.toggle('fold',on);fold.textContent=on?'展開篩選 ▾':'收合篩選 ▴';fold.setAttribute('aria-expanded',on?'false':'true')}
try{setFold(localStorage.getItem('pk-genfold')==='1')}catch(e){setFold(false)}
fold.addEventListener('click',function(){var on=!fbox.classList.contains('fold');setFold(on);try{localStorage.setItem('pk-genfold',on?'1':'0')}catch(e){}});

// ---------- 初始化 ----------
var tops=Object.keys(TC).filter(function(t){return t!=='無'}).map(function(t){return '<option>'+t+'</option>'}).join('');
ft.innerHTML='<option value="">屬性（不限）</option>'+tops;
ft2.innerHTML='<option value="">第二屬性（不限）</option><option value="-">只有單一屬性</option>'+tops;
fg.innerHTML='<option value="">全部世代</option>'+Object.keys(GZ).map(function(k){return '<option value="'+k+'">'+GZ[k]+'</option>'}).join('');
fr.innerHTML='<option value="">全部建議階級</option>'+Object.keys(RZ).map(function(k){return '<option value="'+k+'">建議'+RZ[k]+'</option>'}).join('');
fs.innerHTML='<option value="">全部進化階段</option><option>初階</option><option>二階</option><option>最終階</option><option>超級進化</option><option>未知</option>';
rk.innerHTML='<option value="">依寶可夢的建議階級</option><option value="r">隨機階級</option>'+Object.keys(RZ).map(function(k){return '<option value="'+k+'">'+RZ[k]+'</option>'}).join('');
refilter();
var hm=location.hash.match(/^#s=(.+)$/),loaded=hm&&decode(hm[1]);
if(valid(loaded)){cur=loaded;render()}else generate(false);
})();
