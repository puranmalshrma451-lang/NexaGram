 "use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
export default function Profile(){const [user,setUser]=useState<any>(null);const [profile,setProfile]=useState<any>(null);const [msg,setMsg]=useState("Loading profile…");
 useEffect(()=>{(async()=>{if(!supabase){setMsg("Connect Supabase first. See SETUP.md.");return;}const {data:{user:u}}=await supabase.auth.getUser();setUser(u);if(!u){setMsg("Please log in to view your profile.");return;}const {data,error}=await supabase.from("profiles").select("*").eq("id",u.id).maybeSingle();if(error)setMsg(error.message);else{setProfile(data);setMsg("");}})()},[]);
 return <main className="profilePage"><Link href="/">← Home</Link><h1>Your Profile</h1>{user?<><h2>@{profile?.username||user.user_metadata?.username||"member"}</h2><p>{profile?.full_name||"Add your name in your profile settings soon."}</p><p>{user.email}</p></>:<p>{msg}</p>}</main>
}