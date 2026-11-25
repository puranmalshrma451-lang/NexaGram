 "use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Home, Search, Compass, Clapperboard, MessageCircle, Heart, PlusSquare, UserRound, LogOut, Bookmark, ImagePlus } from "lucide-react";

type Post = {
  id: string; user_id: string; caption: string; image_url: string | null; created_at: string;
  profiles?: { username: string; full_name: string | null; avatar_url: string | null } | null;
  likes?: { user_id: string }[];
  comments?: { id: string; body: string; user_id: string }[];
};

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Loading NexaGram…");

  async function load() {
    if (!supabase) { setMessage("Connect Supabase to activate NexaGram. Follow SETUP.md."); return; }
    const { data: { session: current } } = await supabase.auth.getSession();
    setSession(current);
    const { data, error } = await supabase.from("posts")
    .select("id,user_id,caption,image_url,created_at,profiles!posts_user_id_fkey(username,full_name,avatar_url),likes(user_id),comments(id,body,user_id)")
      .order("created_at", { ascending: false }).limit(30);
    if (error) setMessage(error.message);
    else { setPosts((data || []) as unknown as Post[]); setMessage(""); }
  }

  useEffect(() => {
    load();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(() => load());
    const channel = supabase.channel("public-post-updates").on("postgres_changes",
      { event: "*", schema: "public", table: "posts" }, () => load()).subscribe();
    supabase?.removeChannel(channel);
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !session) { setMessage("Please sign in before posting."); return; }
    if (!caption.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id, caption: caption.trim(), image_url: imageUrl.trim() || null
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setCaption(""); setImageUrl(""); setMessage("Post shared!"); load(); }
  }

  async function toggleLike(post: Post) {
    if (!supabase || !session) { setMessage("Sign in to like posts."); return; }
    const already = post.likes?.some(x => x.user_id === session.user.id);
    const result = already
      ? await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", session.user.id)
      : await supabase.from("likes").insert({ post_id: post.id, user_id: session.user.id });
    if (result.error) setMessage(result.error.message); else load();
  }

  async function addComment(postId: string) {
    if (!supabase || !session) { setMessage("Sign in to comment."); return; }
    const body = window.prompt("Write a comment");
    if (!body?.trim()) return;
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: session.user.id, body: body.trim() });
    if (error) setMessage(error.message); else load();
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); setSession(null); load(); }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand">Nexa<span>Gram</span></div>
      <nav>
        <a className="active"><Home/> Home</a><a><Search/> Search</a><a><Compass/> Explore</a>
        <a><Clapperboard/> Reels</a><a><MessageCircle/> Messages</a><a><Heart/> Notifications</a>
        <a href="#create"><PlusSquare/> Create</a><a href="/profile"><UserRound/> Profile</a><a><Bookmark/> Saved</a>
      </nav>
      <button className="quiet" onClick={signOut}><LogOut/> Sign out</button>
    </aside>
    <section className="main">
      <header className="mobileHead"><div className="brand">Nexa<span>Gram</span></div><button className="iconBtn" onClick={()=>location.href="/login"}>Log in</button></header>
      <div className="stories">
        {["your story","maya","aarav","riya","kabir","sana"].map((name,i)=><div className="story" key={name}>
          <div className={"storyRing "+(i===0?"own":"")}><div>{i===0?"+":name[0].toUpperCase()}</div></div><small>{name}</small>
        </div>)}
      </div>
      <div className="feedHead"><h2>Home</h2><span>For you</span></div>
      <form id="create" className="composer" onSubmit={createPost}>
        <div className="composerTitle"><ImagePlus/> Create a post</div>
        <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder={session?"Share something with your community…":"Sign in to create a post"} />
        <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="Image URL (optional for this starter)" />
        <div className="composerFoot"><small>{session ? `Posting as ${session.user.email}` : "Sign in required to publish"}</small><button disabled={busy || !caption.trim()}>{busy?"Sharing…":"Share post"}</button></div>
      </form>
      {message && <p className="notice">{message}</p>}
      {posts.length===0 && !message && <div className="empty">No posts yet. Be the first to share something!</div>}
      <div className="posts">{posts.map(post=><article className="post" key={post.id}>
        <div className="postTop"><div className="avatar">{(post.profiles?.username || "N")[0].toUpperCase()}</div>
          <div><b>@{post.profiles?.username || "nexagram_user"}</b><small>{new Date(post.created_at).toLocaleString()}</small></div><span className="dots">•••</span></div>
        {post.image_url && <img className="postImage" src={post.image_url} alt="Post media"/>}
        <div className="postActions"><button onClick={()=>toggleLike(post)}><Heart fill={post.likes?.some(x=>x.user_id===session?.user?.id)?"#ed4956":"none"} color={post.likes?.some(x=>x.user_id===session?.user?.id)?"#ed4956":"currentColor"}/></button><button onClick={()=>addComment(post.id)}><MessageCircle/></button><button><span className="shareGlyph">➤</span></button><span className="save"><Bookmark/></span></div>
        <b className="likes">{post.likes?.length || 0} likes</b><p className="caption"><b>@{post.profiles?.username || "nexagram_user"}</b> {post.caption}</p>
        <button className="commentLink" onClick={()=>addComment(post.id)}>View / add comments ({post.comments?.length || 0})</button>
      </article>)}</div>
    </section>
    <aside className="rightbar"><div className="account"><div className="avatar large">{session?.user?.email?.[0]?.toUpperCase() || "N"}</div><div><b>{session?.user?.email || "Welcome to NexaGram"}</b><small>{session?"Your account":"Join the community"}</small></div></div>
      <div className="suggest"><b>New to NexaGram?</b><p>Create an account to follow people, share posts and join the conversation.</p><a className="primary full" href="/signup">Sign up</a><a className="loginLink" href="/login">Already have an account? Log in</a></div>
      <small className="muted">About · Help · Privacy · Terms</small><small className="muted">© 2026 NEXAGRAM</small>
    </aside>
  </main>;
}
