 "use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../auth.css";
export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase){setMsg("Supabase is not configured. Follow SETUP.md.");return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)setMsg(error.message);else router.push("/");}
 return <main className="authWrap"><div><form className="authCard" onSubmit={submit}><h1>NexaGram</h1><p>Log in to see photos and updates from your community.</p><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary" disabled={busy}>{busy?"Logging in…":"Log in"}</button>{msg&&<p className="authError">{msg}</p>}</form><div className="authBottom">Don't have an account? <Link href="/signup">Sign up</Link></div><p style={{textAlign:"center"}}><Link href="/">← Back to NexaGram</Link></p></div></main>
}