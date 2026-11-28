
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SavedPost = {
  user_id: string;
  post_id: string;
  created_at: string;
  posts: {
    id: string;
    caption: string;
    image_url: string | null;
    user_id: string;
  } | null;
};

export default function SavedPage() {
  const [items, setItems] = useState<SavedPost[]>([]);
  const [userId, setUserId] = useState("");
  const [notice, setNotice] = useState("Loading saved posts...");

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setNotice("Supabase is not configured.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNotice("Please login first.");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("saved_posts")
        .select("user_id,post_id,created_at,posts(id,caption,image_url,user_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setNotice(error.message);
        return;
      }

      setItems((data || []) as unknown as SavedPost[]);
      setNotice(data?.length ? "" : "No saved posts yet.");
    }

    load();
  }, []);

  async function removeSaved(postId: string) {
    if (!supabase || !userId) return;

    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) {
      setNotice(error.message);
      return;
    }

    setItems((current) =>
      current.filter((item) => item.post_id !== postId)
    );
  }

  return (
    <main style={{
      maxWidth: 850,
      margin: "25px auto",
      padding: 20,
      color: "#111",
      fontFamily: "Arial, sans-serif"
    }}>
      <Link href="/">← Back to Home</Link>
      <h1>Saved Posts</h1>

      {notice && <p>{notice}</p>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
        gap: 15
      }}>
        {items.map((item) => (
          <article key={item.post_id} style={{
            border: "1px solid #ddd",
            borderRadius: 9,
            overflow: "hidden"
          }}>
            {item.posts?.image_url && (
              <img
                src={item.posts.image_url}
                alt="Saved post"
                style={{
                  width: "100%",
                  height: 190,
                  objectFit: "cover"
                }}
              />
            )}

            <p style={{ padding: 10 }}>
              {item.posts?.caption || "Post"}
            </p>

            <button
              onClick={() => removeSaved(item.post_id)}
              style={{ margin: 10 }}
            >
              Remove from Saved
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
