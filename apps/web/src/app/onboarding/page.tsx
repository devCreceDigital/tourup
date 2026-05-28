"use client";
import { useState, useEffect, useRef } from "react";

type Message = { id: string; role: "ai" | "user"; content: string; chips?: string[] };

const TIPOS = ["Agencia Minorista", "Operador Mayorista", "DMC / Local", "Guia Independiente", "Agencia Online", "Otro"];

function uid() { return Math.random().toString(36).slice(2, 9); }
function AIAvatar() { return <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#0A2540,#1a3a5c)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(10,37,64,0.3)"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg></div>; }
function Chip({ label, onClick, primary }) { if(primary) return <button onClick={onClick} style={{background:"#0A2540",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:600,boxShadow:"0 4px 24px rgba(10,37,64,0.18)"}}>{label}</button>; return <button onClick={onClick} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:20,padding:"8px 18px",fontSize:13,color:"#0A2540",cursor:"pointer"}}>{label}</button>; }

function validateCompany(company) {
  const errors = [];
  if(!company.nombre || company.nombre.trim().length < 3) errors.push("Nombre debe tener al menos 3 caracteres");
  if(!company.nombre || company.nombre.trim().length > 100) errors.push("Nombre no puede exceder 100 caracteres");
  if(!company.slogan || company.slogan.trim().length < 5) errors.push("Slogan debe tener al menos 5 caracteres");
  if(!company.descripcion || company.descripcion.trim().length < 10) errors.push("Descripcion debe tener al menos 10 caracteres");
  if(!company.mision || company.mision.trim().length < 10) errors.push("Mision debe tener al menos 10 caracteres");
  if(!company.vision || company.vision.trim().length < 10) errors.push("Vision debe tener al menos 10 caracteres");
  const emailRegex = /^[^\s@]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|[a-z0-9]+\.[a-z]{2,})$/i;
  if(!company.email || !emailRegex.test(company.email)) errors.push("Email invalido (gmail, hotmail, outlook, yahoo u otro dominio valido)");
  const phoneRegex = /^\d{7,15}$/;
  if(!company.telefono || !phoneRegex.test(company.telefono.replace(/[-\s]/g,""))) errors.push("Telefono invalido (7-15 digitos)");
  return errors;
}


function CompanyForm({ onSubmit, initialData }) {
  const [company, setCompany] = useState(initialData || {nombre:"",slogan:"",descripcion:"",mision:"",vision:"",email:"",telefono:""});
  return <div style={{maxWidth:640,margin:"0 auto",padding:"20px"}}><h2 style={{fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:20}}>Informacion de tu Agencia</h2><div style={{display:"grid",gap:16}}><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Nombre de la Agencia</label><input value={company.nombre} onChange={e=>setCompany({...company,nombre:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Slogan</label><input value={company.slogan} onChange={e=>setCompany({...company,slogan:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Descripcion</label><textarea value={company.descripcion} onChange={e=>setCompany({...company,descripcion:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",minHeight:"80px",fontFamily:"inherit"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Mision</label><textarea value={company.mision} onChange={e=>setCompany({...company,mision:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",minHeight:"80px",fontFamily:"inherit"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Vision</label><textarea value={company.vision} onChange={e=>setCompany({...company,vision:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",minHeight:"80px",fontFamily:"inherit"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Email</label><input value={company.email} onChange={e=>setCompany({...company,email:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540"}} /></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8}}>Telefono</label><input value={company.telefono} onChange={e=>setCompany({...company,telefono:e.target.value})} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540"}} /></div></div><button onClick={()=>{const errors=validateCompany(company);if(errors.length>0){alert("Errores en el formulario:\n"+errors.join("\n"));}else{onSubmit(company);}}} disabled={validateCompany(company).length>0} style={{width:"100%",marginTop:24,background:validateCompany(company).length>0?"#EEF2F7":"#0A2540",color:validateCompany(company).length>0?"#94A3B8":"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:validateCompany(company).length>0?"default":"pointer"}}>Confirmar Agencia</button></div>;
}

export default function OnboardingPage() {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState(0);
  const [input, setInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [lastCompanyData, setLastCompanyData] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages,showForm]);
  useEffect(() => { const t = setTimeout(() => pushAI("Hola. Soy el asistente de activacion de Traventia. En menos de 3 minutos voy a dejarte listo: Pagina publica para recibir clientes, Primer viaje publicado y listo para vender, Pipeline de reservas operativo, Estructura completa de tu agencia. Solo necesito conocerte un poco.", ["Empecemos"]), 300); return () => clearTimeout(t); }, []);

  function pushAI(content, chips) { setMessages(prev => [...prev, {id:uid(),role:"ai",content,chips}]); }
  function pushUser(content) { setMessages(prev => [...prev, {id:uid(),role:"user",content}]); }

  function handleChip(chip) {
    pushUser(chip);
    if(phase===0) { setPhase(1); pushAI("Como describes mejor tu operacion de viajes?", TIPOS); }
    else if(phase===1) { setPhase(2); setShowForm(true); pushAI("Detecte que operas como " + chip + ". Ahora necesito los datos de tu agencia para crear tu pagina publica.", []); }
  }

  function handleCompanySubmit(company) {
    const isFirst = !lastCompanyData;
    const changed = !isFirst && (lastCompanyData.nombre !== company.nombre || lastCompanyData.slogan !== company.slogan || lastCompanyData.descripcion !== company.descripcion || lastCompanyData.mision !== company.mision || lastCompanyData.vision !== company.vision || lastCompanyData.email !== company.email || lastCompanyData.telefono !== company.telefono);
    if(isFirst) {  }
    else if(changed) {  }
    setLastCompanyData(company);
    setCompanyData(company);
    setShowForm(false);
    setPhase(3);
  }

  const lastAIMsg = [...messages].reverse().find(m => m.role==="ai" && m.chips);
  const activeChips = lastAIMsg?.chips;

  return <div style={{minHeight:"100vh",background:"#F7F8FA",fontFamily:"Inter,-apple-system,sans-serif"}}>
    <style dangerouslySetInnerHTML={{__html:"@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .msg-in{animation:fadeUp 0.35s ease forwards}"}}></style>
    <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(247,248,250,0.96)",borderBottom:"1px solid #E2E8F0",padding:"14px 24px"}}>
      <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#16EFFF",boxShadow:"0 0 8px #16EFFF"}} />
        <span style={{fontSize:15,fontWeight:600,color:"#0A2540"}}>Traventia AI</span>
      </div>
    </div>
    <div style={{maxWidth:640,margin:"0 auto",padding:"32px 16px 160px"}}>
      {messages.map(msg=><div key={msg.id} className="msg-in" style={{display:"flex",gap:12,marginBottom:12,justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start"}}>{msg.role==="ai"&&<AIAvatar />}<div style={{background:msg.role==="ai"?"#fff":"#0A2540",border:msg.role==="ai"?"1px solid #E2E8F0":"none",borderRadius:msg.role==="ai"?"0 18px 18px 18px":"18px 0 18px 18px",padding:"14px 18px",fontSize:14,color:msg.role==="ai"?"#1a2e45":"#fff",maxWidth:500,whiteSpace:"pre-line",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",lineHeight:1.6}}>{msg.content}</div></div>)}
      {showForm&&<CompanyForm onSubmit={handleCompanySubmit} initialData={companyData} />}
      {phase===3&&companyData&&<div style={{maxWidth:640,margin:"20px auto",background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20}}><h3 style={{fontSize:16,fontWeight:600,color:"#0A2540",marginBottom:4}}>La informacion de tu agencia</h3><p style={{fontSize:13,color:"#64748B",marginBottom:16}}>Confirma la informacion de tu agencia, pues la usara para hacer la configuracion.</p><div style={{background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16}}><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Nombre</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.nombre}</p><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Slogan</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.slogan}</p><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Descripcion</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.descripcion}</p><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Mision</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.mision}</p><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Vision</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.vision}</p></div><div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:8,padding:12,marginBottom:16}}><p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:6}}>Detalles de Contacto</p><p style={{fontSize:13,color:"#64748B"}}>Email y telefono para que tus clientes puedan contactarte</p></div><div style={{background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16}}><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Email</p><p style={{fontSize:14,color:"#1a2e45",marginBottom:16}}>{companyData.email}</p><p style={{fontSize:14,fontWeight:600,color:"#0A2540",marginBottom:8}}>Telefono</p><p style={{fontSize:14,color:"#1a2e45"}}>{companyData.telefono}</p></div><button onClick={()=>{setShowForm(true); setPhase(2);}} style={{width:100,background:"#fff",border:"1px solid #E2E8F0",borderRadius:6,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#0A2540",fontWeight:600,marginBottom:16}}>Editar</button><p style={{fontSize:13,color:"#0A2540",fontWeight:600,marginBottom:12}}>Todo luce bien</p><div style={{display:"flex",gap:8}}><button onClick={()=>{ if(phase===3) { const resumen = "Excelente. He analizado tu agencia " + companyData.nombre + " y veo un gran potencial. Tu mision de " + companyData.mision + " combinada con la vision de " + companyData.vision + " muestra una direccion clara. Tu descripcion destaca perfectamente tus valores. Creo que este enfoque estrategico te llevara a resultados excepcionales en el mercado de viajes. Ahora vamos a configurar tu primer viaje para que comiences a recibir clientes."; pushAI(resumen, ["Crear Viaje", "Terminar por ahora"]); setPhase(4); } }} style={{flex:1,background:"#D946EF",color:"#fff",border:"none",borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>Si, parece correcto</button></div></div>}
      <div ref={bottomRef} />
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(247,248,250,0.96)",borderTop:"1px solid #E2E8F0",padding:"12px 16px 20px"}}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        {activeChips&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,justifyContent:activeChips.length===1?"center":"flex-start"}}>{activeChips.map(chip=><Chip key={chip} label={chip} primary={activeChips.length===1} onClick={()=>handleChip(chip)} />)}</div>}
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:24,padding:"10px 14px",display:"flex",gap:10,boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Responde aqui..." style={{flex:1,border:"none",outline:"none",fontSize:14,color:"#0A2540",background:"transparent"}} /><button disabled={!input.trim()} style={{width:32,height:32,borderRadius:"50%",background:input.trim()?"#0A2540":"#EEF2F7",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill={input.trim()?"#16EFFF":"#94A3B8"}><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg></button></div>
      </div>
    </div>
  </div>;
}