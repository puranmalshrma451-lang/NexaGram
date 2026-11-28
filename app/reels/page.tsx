
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string;
  created_at: string;
};

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadReels() {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("reels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setReels((data || []) as Reel[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReels();
  }, []);

  async function addReel(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase.from("reels").insert({
      user_id: user.id,
      video_url: videoUrl.trim(),
      caption: caption.trim(),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setVideoUrl("");
    setCaption("");
    setMessage("Reel added successfully!");
    loadReels();
  }

  async function deleteReel(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from("reels")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReels((current) => current.filter((reel) => reel.id !== id));
  }

  return (
    <main style={{
      maxWidth: 650,
      margin: "25px auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      color: "#111"
    }}>
      <Link href="/">← Back to Home</Link>

      <h1>NexaGram Reels</h1>
      <p>Watch and share short videos.</p>

      <form onSubmit={addReel} style={{
        display: "grid",
        gap: 10,
        padding: 15,
        border: "1px solid #ddd",
        borderRadius: 10,
        marginBottom: 25
      }}>
        <h3>Share a Reel</h3>

        <input
          type="url"
          placeholder="Video URL (https://...)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          style={{ padding: 12 }}
        />

        <input
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          style={{ padding: 12 }}
        />

        <button type="submit" style={{
          padding: 12,
          background: "#111",
          color: "white",
          border: 0,
          borderRadius: 7
        }}>
          Publish Reel
        </button>
      </form>

      {message && <p>{message}</p>}

      {loading ? (
        <p>Loading Reels...</p>
      ) : reels.length === 0 ? (
        <p>No Reels yet. Share the first one!</p>
      ) : (
        reels.map((reel) => (
          <article key={reel.id} style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            marginBottom: 20
          }}>
            <video
              src={reel.video_url}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                maxHeight: 550,
                background: "#000",
                borderRadius: 8
              }}
            />

            <p>{reel.caption}</p>

            <button onClick={() => deleteReel(reel.id)}>
              Delete
            </button>
          </article>
        ))
      )}
    </main>
  );
}
