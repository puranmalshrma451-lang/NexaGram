
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
  expires_at: string;
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [userId, setUserId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [message, setMessage] = useState("Loading stories...");
  const [busy, setBusy] = useState(false);

  const loadStories = useCallback(async () => {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setUserId("");
      setStories([]);
      setMessage("Please log in to view stories.");
      return;
    }

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setStories((data || []) as Story[]);
    setMessage(data?.length ? "" : "No stories yet. Share the first one!");
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  async function createStory(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !userId) {
      setMessage("Please log in first.");
      return;
    }

    if (!mediaUrl.trim()) {
      setMessage("Please enter a media URL.");
      return;
    }

    try {
      const url = new URL(mediaUrl.trim());

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        setMessage("Please enter a valid HTTP or HTTPS URL.");
        return;
      }
    } catch {
      setMessage("Please enter a valid media URL.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.from("stories").insert({
      user_id: userId,
      media_url: mediaUrl.trim(),
      media_type: mediaType,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMediaUrl("");
    setMessage("Story shared successfully!");
    await loadStories();
  }

  async function deleteStory(id: string) {
    if (!supabase || !userId) return;

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadStories();
  }

  return (
    <main style={{
      maxWidth: 760,
      margin: "35px auto",
      padding: 20,
      color: "black",
      fontFamily: "Arial, sans-serif"
    }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ marginTop: 25 }}>NexaGram Stories</h1>
      <p>Share a moment with your community. Stories expire after 24 hours.</p>

      <form
        onSubmit={createStory}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          marginTop: 25
        }}
      >
        <h3>Create a Story</h3>

        <input
          type="url"
          required
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="Paste image or video URL"
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 12
          }}
        />

        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as "image" | "video")}
          style={{ padding: 10, marginRight: 10 }}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>

        <button
          disabled={busy || !userId}
          style={{
            padding: "11px 20px",
            background: "black",
            color: "white",
            border: 0,
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          {busy ? "Sharing..." : "Share Story"}
        </button>
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}

      <h2 style={{ marginTop: 35 }}>Recent Stories</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 15
      }}>
        {stories.map((story) => (
          <article key={story.id} style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            overflow: "hidden"
          }}>
            {story.media_type === "image" ? (
              <img
                src={story.media_url}
                alt="Story"
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 8
                }}
              />
            ) : (
              <video
                src={story.media_url}
                controls
                playsInline
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 8
                }}
              />
            )}

            <p style={{ fontSize: 12, overflowWrap: "anywhere" }}>
              User: {story.user_id.slice(0, 8)}
            </p>

            <small>
              Expires: {new Date(story.expires_at).toLocaleString()}
            </small>

            {story.user_id === userId && (
              <button
                onClick={() => deleteStory(story.id)}
                style={{
                  display: "block",
                  marginTop: 10,
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 7,
                  background: "white"
                }}
              >
                Delete Story
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
