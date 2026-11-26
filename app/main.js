const N=window.NATIONS,Y=window.YEARS;
const METRICS=[{k:"pop",label:"Population (M)",fmt:v=>v.toLocaleString()+" M"},{k:"gdp",label:"GDP ($T)",fmt:v=>"$"+v.toFixed(2)+"T"},{k:"gdpPc",label:"GDP per capita",fmt:v=>"$"+v.toLocaleString()},{k:"life",label:"Life expectancy",fmt:v=>v+" yrs"},{k:"co2",label:"CO₂ per capita (t)",fmt:v=>v+" t"},{k:"internet",label:"Internet users %",fmt:v=>v+"%"}];
let rankMetric="pop",lastView="overview";
const $=s=>document.querySelector(s);
function show(v){["overview","table","compare","detail"].forEach(x=>$("#view-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===v));if(v!=="detail")lastView=v;window.scrollTo(0,0);}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.view));
function cards(){const tp=N.reduce((a,c)=>a+c.pop,0),tg=N.reduce((a,c)=>a+c.gdp,0),al=(N.reduce((a,c)=>a+c.life,0)/N.length).toFixed(1),hi=[...N].sort((a,b)=>b.gdpPc-a.gdpPc)[0];
$("#statCards").innerHTML=`<div class="card"><b>${N.length}</b><span>countries tracked</span></div><div class="card"><b>${tp.toLocaleString()} M</b><span>combined population</span></div><div class="card"><b>$${tg.toFixed(1)}T</b><span>combined GDP</span></div><div class="card"><b>${al} yrs</b><span>average life expectancy</span></div><div class="card"><b>${hi.flag} ${hi.name}</b><span>highest GDP per capita</span></div>`;}
function ranks(){const m=METRICS.find(x=>x.k===rankMetric);const s=[...N].sort((a,b)=>b[m.k]-a[m.k]);const max=s[0][m.k];
$("#rankTabs").innerHTML=METRICS.map(x=>`<button data-k="${x.k}" class="${x.k===rankMetric?'on':''}">${x.label}</button>`).join("");
document.querySelectorAll("#rankTabs button").forEach(b=>b.onclick=()=>{rankMetric=b.dataset.k;ranks();});
$("#rankList").innerHTML=s.map((c,i)=>`<div class="row"><div class="nm">${i+1}. ${c.flag} ${c.name}</div><div class="bar"><i style="width:${Math.max(3,c[m.k]/max*100)}%"></i></div><div class="vl">${m.fmt(c[m.k])}</div></div>`).join("");}
function scatter(){const cv=$("#scatter"),x=cv.getContext("2d");x.clearRect(0,0,900,340);x.strokeStyle="#475569";x.beginPath();x.moveTo(60,300);x.lineTo(880,300);x.moveTo(60,300);x.lineTo(60,20);x.stroke();
x.fillStyle="#94a3b8";x.font="12px sans-serif";x.fillText("GDP per capita →",700,325);x.fillText("Life expectancy ↑",65,15);
N.forEach(c=>{const px=60+c.gdpPc/85000*800,py=300-(c.life-50)/40*270;x.fillStyle="#38bdf8";x.beginPath();x.arc(px,py,6,0,7);x.fill();x.fillStyle="#e2e8f0";x.font="11px sans-serif";x.fillText(c.name,px+9,py+4);});}
function table(){const q=$("#q").value.toLowerCase(),r=$("#region").value,k=$("#sort").value;
let s=N.filter(c=>(!r||c.region===r)&&(c.name.toLowerCase().includes(q)||c.cn.includes(q))).sort((a,b)=>b[k]-a[k]);
$("#tbody").innerHTML=s.map(c=>`<tr data-id="${c.id}"><td>${c.flag} ${c.name}</td><td>${c.pop.toLocaleString()}</td><td>${c.gdp.toFixed(2)}</td><td>$${c.gdpPc.toLocaleString()}</td><td>${c.life}</td><td>${c.co2}</td><td>${c.internet}%</td><td>${c.urban}%</td></tr>`).join("")||`<tr><td colspan="8">No country matches.</td></tr>`;
document.querySelectorAll("#tbody tr[data-id]").forEach(tr=>tr.onclick=()=>detail(tr.dataset.id));}
function trendSVG(vals,color){const w=460,h=140,mx=Math.max(...vals)*1.05,mn=Math.min(...vals)*0.95;const pts=vals.map((v,i)=>`${20+i*(w-40)/5},${h-15-(v-mn)/(mx-mn)*(h-35)}`).join(" ");
return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;background:#1e293b;border-radius:10px"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3"/>${vals.map((v,i)=>`<text x="${16+i*(w-40)/5}" y="${h-2}" fill="#94a3b8" font-size="10">${Y[i]}</text>`).join("")}</svg>`;}
function detail(id){const c=N.find(x=>x.id===id);if(!c)return;
$("#detail").innerHTML=`<h2 style="font-size:26px;margin:0">${c.flag} ${c.name} <small style="color:#94a3b8;font-size:15px">${c.cn} · ${c.region}</small></h2>
<div class="detailgrid"><div class="card"><b>${c.pop.toLocaleString()} M</b><span>population</span></div><div class="card"><b>$${c.gdp.toFixed(2)}T</b><span>GDP</span></div><div class="card"><b>$${c.gdpPc.toLocaleString()}</b><span>GDP per capita</span></div><div class="card"><b>${c.life} yrs</b><span>life expectancy</span></div><div class="card"><b>${c.co2} t</b><span>CO₂ per capita</span></div><div class="card"><b>${c.internet}%</b><span>internet users</span></div><div class="card"><b>${c.urban}%</b><span>urban population</span></div><div class="card"><b>${c.fert}</b><span>fertility rate</span></div></div>
<h2>Population trend (millions)</h2>${trendSVG(c.popTrend,"#38bdf8")}<h2>GDP trend ($ trillions)</h2>${trendSVG(c.gdpTrend,"#34d399")}
<p class="hint">Land area ≈ ${c.area.toLocaleString()} thousand km² · population density ≈ ${Math.round(c.pop*1000/c.area)} people/km²</p>`;
show("detail");}
$("#back").onclick=()=>show(lastView);
function cmpCard(c){return `<div class="cmpcard"><h3>${c.flag} ${c.name}</h3>${METRICS.map(m=>`<div class="kv"><span>${m.label}</span><b>${m.fmt(c[m.k])}</b></div>`).join("")}<div class="kv"><span>Urban %</span><b>${c.urban}%</b></div><div class="kv"><span>Fertility</span><b>${c.fert}</b></div></div>`;}
function compare(){const a=N.find(c=>c.id===$("#cmpA").value),b=N.find(c=>c.id===$("#cmpB").value);
$("#cmpOut").innerHTML=`<div class="cmpgrid">${cmpCard(a)}${cmpCard(b)}</div><p class="hint">${a.name} has ${a.pop>b.pop?"more":"fewer"} people (${a.pop}M vs ${b.pop}M) and ${a.gdpPc>b.gdpPc?"higher":"lower"} GDP per capita ($${a.gdpPc.toLocaleString()} vs $${b.gdpPc.toLocaleString()}).</p>`;}
const opts=N.map(c=>`<option value="${c.id}">${c.flag} ${c.name}</option>`).join("");$("#cmpA").innerHTML=opts;$("#cmpB").innerHTML=opts;$("#cmpA").value="jp";$("#cmpB").value="de";
$("#cmpA").onchange=compare;$("#cmpB").onchange=compare;
[...new Set(N.map(c=>c.region))].forEach(r=>{const o=document.createElement("option");o.value=r;o.textContent=r;$("#region").appendChild(o);});
["q","region","sort"].forEach(id=>$("#"+id).addEventListener("input",table));
cards();ranks();scatter();table();compare();
// deep links for screenshots: #table #compare #country-jp
const h=location.hash.replace("#","");if(h==="table")show("table");else if(h==="compare")show("compare");else if(h.startsWith("country-"))detail(h.slice(8));
