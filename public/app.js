(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var NS='http://www.w3.org/2000/svg';
var people=[],byId={},me='steve',histories={},pending={};
var SUGG=["What's the status of Strawberry?","What is Clementine?","File a bug on Strawberry: hydration sensor reads zero after reboot","What's at risk across all projects this quarter?","What's our time off policy?"];
try{me=localStorage.getItem('persona')||'steve'}catch(e){}

function j(url,opts){return fetch(url,opts).then(function(r){if(!r.ok){var e=new Error('HTTP '+r.status);e.status=r.status;throw e}return r.json()})}
function cur(){return byId[me]||{id:me,name:me}}

/* ---------- org ---------- */
function renderOrg(){
  var kids={},roots=[];
  people.forEach(function(p){ if(p.manager&&byId[p.manager]){(kids[p.manager]=kids[p.manager]||[]).push(p)} else roots.push(p)});
  function node(p){
    var chips=(p.disclosures||[]).map(function(d){return '<span class="chip proj">'+esc(d)+'</span>'}).join('');
    var lv=(p.level!=null)?'<span class="lvl">L'+p.level+'</span>':'';
    var h='<li><div class="card'+(p.id===me?' sel':'')+'" data-id="'+p.id+'"><div class="n"><span>'+esc(p.name)+'</span>'+lv+'</div><div class="t">'+esc(p.title||p.role||'')+' &middot; '+esc(p.team||'')+'</div>'+(chips?'<div class="chips">'+chips+'</div>':'<div class="chips"><span class="chip">no project disclosures</span></div>')+'</div>';
    if(kids[p.id]) h+='<ul>'+kids[p.id].map(node).join('')+'</ul>';
    return h+'</li>';
  }
  $('org').innerHTML='<div class="tree"><ul>'+roots.map(node).join('')+'</ul></div>';
  Array.prototype.forEach.call(document.querySelectorAll('.card'),function(c){c.onclick=function(){setPersona(c.getAttribute('data-id'))}});
}
function renderPill(){
  var p=cur();
  $('viewing').innerHTML='Viewing as <b>'+esc(p.name)+'</b> <small>'+esc(p.title||p.role||'')+(p.level!=null?' &middot; L'+p.level:'')+'</small>';
}

/* ---------- brain graph ---------- */
var MOCK_CATS=[
 {id:'contacts',label:'Contacts',sources:[['Org chart',null,0],['Watch team page','clementine',1],['OrangeOS team page','navel',1]]},
 {id:'disclosures',label:'Disclosures',sources:[['Disclosure policy',null,1],['Clementine roster','clementine',1],['Strawberry roster','strawberry',1],['Navel roster','navel',1]]},
 {id:'tools',label:'Tools',sources:[['Pulp',null,1],['Peel',null,1],['Zest',null,1],['Grove',null,1],['Press',null,1],['Seed',null,1]]},
 {id:'documents',label:'Documents',sources:[['Time off policy',null,1],['Strawberry notes','strawberry',1],['Navel notes','navel',1],['Manager playbook',null,2],['Board notes',null,3]]},
 {id:'branding',label:'Branding',sources:[['Brand guide',null,0],['Launch messaging','strawberry',1]]}
];
function mockBrain(){
  var p=cur(),lvl=p.level!=null?p.level:1,disc=p.disclosures||[];
  return {hub:'Orange Company Brain',mock:true,categories:MOCK_CATS.map(function(c){return {id:c.id,label:c.label,sources:c.sources.map(function(s,i){
    return {id:c.id+i,title:s[0],project:s[1],level:s[2],visible:lvl>=s[2]&&(!s[1]||disc.indexOf(s[1])>=0)}})}})};
}
function svg(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function drawBrain(b){
  var cats=b.categories||[],tot=0,vis=0;
  cats.forEach(function(c){c.sources.forEach(function(s){tot++;if(s.visible)vis++})});
  $('count').innerHTML='You can see <b>'+vis+'</b> of <b>'+tot+'</b> sources';
  $('note').textContent=b.mock?'brain endpoint pending (showing static mock)':'';
  var W=900,H=800,cx=W/2,cy=H/2,R=235;
  var box=$('graph');box.innerHTML='';
  var s=svg('svg',{viewBox:'0 0 '+W+' '+H,preserveAspectRatio:'xMidYMid meet'},box);
  var g=svg('g',{},s);
  var layer1=svg('g',{},g),layer2=svg('g',{},g);
  cats.forEach(function(c,i){
    var a=-Math.PI/2+i*2*Math.PI/cats.length,x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);
    svg('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#FF7A00','stroke-opacity':.5,'stroke-width':2},layer1);
    var n=c.sources.length,spread=Math.min(Math.PI*1.6,0.62*n+0.3),r2=Math.max(85,n*34/spread);
    c.sources.forEach(function(src,k){
      var sa=a+(n===1?0:(k/(n-1)-0.5)*spread),sx=x+r2*Math.cos(sa),sy=y+r2*Math.sin(sa);
      svg('line',{x1:x,y1:y,x2:sx,y2:sy,stroke:src.visible?'#FF7A00':'#444','stroke-opacity':src.visible?.55:.5,'stroke-width':1.5},layer1);
      var ng=svg('g',{transform:'translate('+sx+','+sy+')',style:'cursor:default'},layer2);
      var t=svg('title',{},ng);
      if(src.visible){
        t.textContent=src.title+(src.project?' ['+src.project+']':'')+' (L'+src.level+')';
        svg('circle',{r:13,fill:'#FF7A00',stroke:'#ffb066','stroke-width':2},ng);
        svg('circle',{r:5,fill:'#fff3e6'},ng);
      }else{
        t.textContent='Restricted';
        svg('circle',{r:13,fill:'#2a2d34',stroke:'#555','stroke-width':1.5},ng);
        var l=svg('text',{'text-anchor':'middle','dominant-baseline':'central','font-size':13},ng);l.textContent='🔒';
      }
    });
    var cg=svg('g',{transform:'translate('+x+','+y+')'},layer2);
    svg('circle',{r:40,fill:'#1d2027',stroke:'#FF7A00','stroke-width':3},cg);
    var tx=svg('text',{'text-anchor':'middle','dominant-baseline':'central',fill:'#f2f3f5','font-size':15,'font-weight':700},cg);tx.textContent=c.label;
    var cv=c.sources.filter(function(q){return q.visible}).length;
    var sub=svg('text',{'text-anchor':'middle',y:56,fill:'#8d94a3','font-size':13},cg);sub.textContent=cv+'/'+c.sources.length;
  });
  var hg=svg('g',{transform:'translate('+cx+','+cy+')'},layer2);
  svg('circle',{r:62,fill:'#FF7A00'},hg);
  [['Orange',-8],['Brain',12]].forEach(function(w){var q=svg('text',{'text-anchor':'middle','dominant-baseline':'central',y:w[1],fill:'#111','font-size':20,'font-weight':800},hg);q.textContent=w[0]});
  try{var bb=s.getBBox(),pad=24;s.setAttribute('viewBox',(bb.x-pad)+' '+(bb.y-pad)+' '+(bb.width+2*pad)+' '+(bb.height+2*pad))}catch(e){}
}
var brainSeq=0;
function loadBrain(){
  var seq=++brainSeq,who=me;
  j('/api/brain?as='+encodeURIComponent(who)).then(function(b){if(seq===brainSeq)drawBrain(b)})
   .catch(function(){if(seq===brainSeq)drawBrain(mockBrain())});
}

/* ---------- chat ---------- */
function hist(){return histories[me]||(histories[me]=[])}
function renderMsg(m){
  if(m.role==='u')return '<div class="m u">'+esc(m.text)+'</div>';
  if(m.role==='think')return '<div class="m a think">thinking... searching the brain as '+esc(m.name)+'<span class="dots"></span></div>';
  var h='<div class="m a">'+esc(m.text);
  if(m.action){
    var done=m.action.status==='done';
    var res=typeof m.action.result==='string'?m.action.result:JSON.stringify(m.action.result);
    h+='<div class="act '+(done?'done':'blocked')+'"><b>'+(done?'Done: ':'Blocked: ')+esc(m.action.tool)+'</b>'+esc(res||'')+'</div>';
  }
  var src=m.sources||[],w=m.withheld||0;
  if(src.length||w){
    h+='<div class="foot">'+src.slice(0,6).map(function(s){return '<span class="chip src">'+esc(s.title||s.id)+'</span>'}).join('')+(src.length>6?'<span class="chip">+'+(src.length-6)+' more</span>':'');
    if(w)h+='<span class="lock">&#128274; '+w+' source'+(w>1?'s':'')+' withheld above your clearance</span>';
    h+='</div>';
  }
  return h+'</div>';
}
function renderChat(){
  var box=$('msgs');
  var h=hist();
  var html=h.map(renderMsg).join('');
  if(!h.length)html='<div class="m a think">You are '+esc(cur().name)+'. Ask your agent anything. It searches the brain with your clearance.</div>';
  box.innerHTML=html;box.scrollTop=box.scrollHeight;
  $('send').disabled=!!pending[me];
}
function ask(text){
  text=(text||'').trim();if(!text||pending[me])return;
  var who=me,p=cur(),h=histories[who]||(histories[who]=[]);
  h.push({role:'u',text:text});
  var th={role:'think',name:p.name};h.push(th);
  pending[who]=true;renderChatIf(who);
  j('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({as:who,message:text})}).then(function(r){
    h.splice(h.indexOf(th),1);
    h.push({role:'a',text:r.answer||'(no answer)',action:r.action||null,sources:r.sources||[],withheld:r.withheld||0});
    if(r.action)loadTimeline();
  }).catch(function(e){
    h.splice(h.indexOf(th),1);h.push({role:'a',text:'Error: '+e.message});
  }).then(function(){pending[who]=false;renderChatIf(who)});
}
function renderChatIf(who){if(who===me)renderChat()}
function renderSugg(){
  $('sugg').innerHTML=SUGG.map(function(s,i){return '<button type="button" data-i="'+i+'">'+esc(s)+'</button>'}).join('');
  Array.prototype.forEach.call($('sugg').querySelectorAll('button'),function(b){b.onclick=function(){ask(SUGG[+b.getAttribute('data-i')])}});
}

/* ---------- timeline ---------- */
var tlSeq=0;
function fillSelect(){
  var sel=$('tlsel'),keep=sel.value;
  sel.innerHTML=people.map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('');
  sel.value=keep&&byId[keep]?keep:'riley';
  if(!sel.value&&people.length)sel.value=people[0].id;
}
function loadTimeline(){
  var of=$('tlsel').value||me,seq=++tlSeq;
  j('/api/timeline?as='+encodeURIComponent(me)+'&of='+encodeURIComponent(of)).then(function(r){
    if(seq!==tlSeq)return;
    var items=(r.items||[]).slice().sort(function(a,b){return String(b.when).localeCompare(String(a.when))});
    $('tlist').innerHTML=items.length?items.map(function(it){
      return '<div class="ti"><div class="d">'+esc(String(it.when).replace('T',' ').slice(0,16))+' &middot; <span class="chip proj">'+esc(it.project||'none')+'</span> <span class="chip">'+esc(it.tool||'')+'</span></div>'+esc(it.summary)+'</div>';
    }).join(''):'<div class="hidden-note">Nothing visible to '+esc(cur().name)+'.</div>';
    $('tlhid').innerHTML=r.hidden>0?'&#128274; '+r.hidden+' task'+(r.hidden>1?'s':'')+' hidden: on projects you aren\'t disclosed on':'';
  }).catch(function(e){if(seq===tlSeq){$('tlist').innerHTML='<div class="hidden-note">Timeline unavailable ('+esc(e.message)+')</div>';$('tlhid').textContent=''}});
}

/* ---------- persona ---------- */
function setPersona(id){
  if(!byId[id])return;
  me=id;try{localStorage.setItem('persona',id)}catch(e){}
  renderPill();renderOrg();renderChat();loadBrain();loadTimeline();
}

$('f').onsubmit=function(e){e.preventDefault();var v=$('q').value;$('q').value='';ask(v)};
$('tlsel').onchange=loadTimeline;
renderSugg();
j('/api/org').then(function(o){
  people=o.people||[];people.forEach(function(p){byId[p.id]=p});
  if(!byId[me])me='steve';
  fillSelect();
  setPersona(me);
}).catch(function(e){$('org').textContent='Could not load /api/org: '+e.message});
})();
