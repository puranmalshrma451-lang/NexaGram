
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Home, Search, Compass, Clapperboard, MessageCircle,
  Heart, PlusSquare, UserRound, LogOut, Bookmark,
  ImagePlus, Bell
} from "lucide-react";

type Post = {
  id: string;
  user_id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  likes: { user_id: string }[];
  comments: { id: string; body: string; user_id: string }[];
};

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Loading NexaGram…");

  const load = useCallback(async () => {
    if (!supabase) {
      setMessage("Supabase connection is not configured.");
      return;
    }

    const { data: auth } = await supabase.auth.getSession();
    const current = auth.session;
    setSession(current);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,user_id,caption,image_url,created_at,
        profiles!posts_user_id_fkey(username,full_name,avatar_url),
        likes(user_id),
        comments(id,body,user_id)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPosts((data || []) as unknown as Post[]);

    if (current) {
      const { data: savedRows } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", current.user.id);

      setSaved((savedRows || []).map((row) => row.post_id));
    } else {
      setSaved([]);
    }

    setMessage("");
  }, []);

  useEffect(() => {
    load();

    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => listener.subscription.unsubscribe();
  }, [load]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !session) {
      setMessage("Please log in before posting.");
      return;
    }

    if (!caption.trim()) return;

    setBusy(true);

    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      caption: caption.trim(),
      image_url: imageUrl.trim() || null,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCaption("");
    setImageUrl("");
    setMessage("Post shared!");
    await load();
  }

  async function toggleLike(post: Post) {
    if (!supabase || !session) {
      setMessage("Please log in to like posts.");
      return;
    }

    const alreadyLiked = post.likes?.some(
      (like) => like.user_id === session.user.id
    );

    const result = alreadyLiked
      ? await supabase.from("likes").delete()
          .eq("post_id", post.id)
          .eq("user_id", session.user.id)
      : await supabase.from("likes").insert({
          post_id: post.id,
          user_id: session.user.id,
        });

    if (result.error) setMessage(result.error.message);
    else await load();
  }

  async function addComment(postId: string) {
    if (!supabase || !session) {
      setMessage("Please log in to comment.");
      return;
    }

    const body = window.prompt("Write your comment");

    if (!body?.trim()) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: session.user.id,
      body: body.trim(),
    });

    if (error) setMessage(error.message);
    else await load();
  }

  async function toggleSave(postId: string) {
    if (!supabase || !session) {
      setMessage("Please log in to save posts.");
      return;
    }

    const isSaved = saved.includes(postId);

    const result = isSaved
      ? await supabase.from("saved_posts").delete()
          .eq("post_id", postId)
          .eq("user_id", session.user.id)
      : await supabase.from("saved_posts").insert({
          post_id: postId,
          user_id: session.user.id,
        });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    await load();
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    await load();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Nexa<span>Gram</span></div>

        <nav>
          <Link className="active" href="/"><Home /> Home</Link>
          <Link href="/explore"><Search /> Search / Explore</Link>
          <Link href="/stories"><Compass /> Stories</Link>
          <Link href="/reels"><Clapperboard /> Reels</Link>
          <Link href="/messages"><MessageCircle /> Messages</Link>
          <Link href="/notifications"><Bell /> Notifications</Link>
          <a href="#create"><PlusSquare /> Create</a>
          <Link href="/profile"><UserRound /> Profile</Link>
          <Link href="/saved"><Bookmark /> Saved</Link>
        </nav>

        <button className="quiet" onClick={signOut}>
          <LogOut /> Sign out
        </button>
      </aside>

      <section className="main">
        <header className="mobileHead">
          <div className="brand">Nexa<span>Gram</span></div>
          <Link className="iconBtn" href="/login">Log in</Link>
        </header>

        <div className="stories">
          {["Your story", "Explore", "Community", "Moments"].map((name, i) => (
            <Link className="story" href="/stories" key={name}>
              <div className={"storyRing " + (i === 0 ? "own" : "")}>
                <div>{i === 0 ? "+" : name[0]}</div>
              </div>
              <small>{name}</small>
            </Link>
          ))}
        </div>

        <div className="feedHead">
          <h2>Home</h2>
          <span>For you</span>
        </div>

        <form id="create" className="composer" onSubmit={createPost}>
          <div className="composerTitle">
            <ImagePlus /> Create a post
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              session
                ? "Share something with your community…"
                : "Log in to create a post"
            }
          />

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
          />

          <div className="composerFoot">
            <small>
              {session ? "Posting as " + session.user.email : "Login required"}
            </small>
            <button disabled={busy || !caption.trim()}>
              {busy ? "Sharing…" : "Share post"}
            </button>
          </div>
        </form>

        {message && <p className="notice">{message}</p>}

        {posts.length === 0 && !message && (
          <div className="empty">No posts yet. Be the first to share!</div>
        )}

        <div className="posts">
          {posts.map((post) => {
            const liked = post.likes?.some(
              (like) => like.user_id === session?.user?.id
            );
            const isSaved = saved.includes(post.id);
            const username = post.profiles?.username || "nexagram_user";

            return (
              <article className="post" key={post.id}>
                <div className="postTop">
                  <div className="avatar">{username[0].toUpperCase()}</div>
                  <div>
                    <b>@{username}</b>
                    <small>{new Date(post.created_at).toLocaleString()}</small>
                  </div>
                  <span className="dots">•••</span>
                </div>

                {post.image_url && (
                  <img
                    className="postImage"
                    src={post.image_url}
                    alt="Post media"
                  />
                )}

                <div className="postActions">
                  <button onClick={() => toggleLike(post)} aria-label="Like">
                    <Heart
                      fill={liked ? "#ed4956" : "none"}
                      color={liked ? "#ed4956" : "currentColor"}
                    />
                  </button>

                  <button
                    onClick={() => addComment(post.id)}
                    aria-label="Comment"
                  >
                    <MessageCircle />
                  </button>

                  <button
                    onClick={() => toggleSave(post.id)}
                    aria-label="Save post"
                  >
                    <Bookmark
                      fill={isSaved ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <b className="likes">{post.likes?.length || 0} likes</b>

                <p className="caption">
                  <b>@{username}</b> {post.caption}
                </p>

                <button
                  className="commentLink"
                  onClick={() => addComment(post.id)}
                >
                  View / add comments ({post.comments?.length || 0})
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="rightbar">
        <div className="account">
          <div className="avatar large">
            {session?.user?.email?.[0]?.toUpperCase() || "N"}
          </div>
          <div>
            <b>{session?.user?.email || "Welcome to NexaGram"}</b>
            <small>{session ? "Your account" : "Join the community"}</small>
          </div>
        </div>

        <div className="suggest">
          <b>New to NexaGram?</b>
          <p>Create an account to follow people, share posts and connect.</p>
          <Link className="primary full" href="/signup">Sign up</Link>
          <Link className="loginLink" href="/login">
            Already have an account? Log in
          </Link>
        </div>

        <small className="muted">About · Help · Privacy · Terms</small>
        <small className="muted">© 2026 NEXAGRAM</small>
      </aside>
    </main>
  );
}
