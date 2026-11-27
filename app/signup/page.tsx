 "use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../auth.css";
export default function Signup(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [username,setUsername]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase){setMsg("Supabase is not configured. Follow SETUP.md.");return;}if(username.length<3){setMsg("Username must be at least 3 characters.");return;}setBusy(true);const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username}}});setBusy(false);if(error)setMsg(error.message);else if(data.session)router.push("/");else setMsg("Check your email to confirm your account, then log in.");}
 return <main className="authWrap"><div><form className="authCard" onSubmit={submit}><h1>NexaGram</h1><p>Sign up to share moments and connect with people.</p><input required minLength={3} maxLength={24} placeholder="Username" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g,""))}/><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required minLength={8} placeholder="Password (at least 8 characters)" value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary" disabled={busy}>{busy?"Creating account…":"Sign up"}</button>{msg&&<p className="authError">{msg}</p>}<small>Use a unique password and keep it private.</small></form><div className="authBottom">Have an account? <Link href="/login">Log in</Link></div><p style={{textAlign:"center"}}><Link href="/">← Back to NexaGram</Link></p></div></main>
}