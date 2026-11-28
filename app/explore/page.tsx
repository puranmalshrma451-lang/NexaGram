
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Person = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  user_id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
};

export default function ExplorePage() {
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();

    const value = term
      .trim()
      .replace(/[^a-zA-Z0-9_.\-\s]/g, " ")
      .replace(/\s+/g, " ");

    if (!value) {
      setMessage("Enter a name, username or keyword.");
      return;
    }

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setBusy(true);
    setMessage("");

    const [peopleResult, postsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url")
        .or(
          `username.ilike.%${value}%,full_name.ilike.%${value}%`
        )
        .limit(20),

      supabase
        .from("posts")
        .select("id,user_id,caption,image_url,created_at")
        .ilike("caption", `%${value}%`)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    setBusy(false);

    if (peopleResult.error || postsResult.error) {
      setMessage(
        peopleResult.error?.message ||
        postsResult.error?.message ||
        "Search failed."
      );
      return;
    }

    setPeople((peopleResult.data || []) as Person[]);
    setPosts((postsResult.data || []) as Post[]);

    if (
      !peopleResult.data?.length &&
      !postsResult.data?.length
    ) {
      setMessage("No results found. Try another search.");
    }
  }

  return (
    <main style={{
      maxWidth: 850,
      margin: "30px auto",
      padding: 20,
      color: "#262626",
      fontFamily: "Arial, sans-serif"
    }}>
      <Link href="/" style={{ color: "#262626" }}>
        ← Back to Home
      </Link>

      <h1 style={{ marginTop: 25 }}>Explore NexaGram</h1>
      <p style={{ color: "#737373" }}>
        Discover people and posts from your community.
      </p>

      <form
        onSubmit={search}
        style={{
          display: "flex",
          gap: 10,
          margin: "25px 0"
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search people or posts..."
          style={{
            flex: 1,
            minWidth: 0,
            padding: 13,
            border: "1px solid #ddd",
            borderRadius: 8
          }}
        />

        <button
          disabled={busy}
          style={{
            padding: "12px 20px",
            background: "#111",
            color: "white",
            border: 0,
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          {busy ? "Searching..." : "Search"}
        </button>
      </form>

      {message && (
        <p style={{ color: "#737373" }}>{message}</p>
      )}

      <h2>People</h2>

      {people.map((person) => (
        <div
          key={person.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderBottom: "1px solid #eee"
          }}
        >
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt=""
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          ) : (
            <div style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#eee",
              display: "grid",
              placeItems: "center",
              fontWeight: "bold"
            }}>
              {person.username[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <b>@{person.username}</b>
            <div style={{ color: "#737373", fontSize: 13 }}>
              {person.full_name || "NexaGram member"}
            </div>
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: 35 }}>Posts</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
        gap: 15
      }}>
        {posts.map((post) => (
          <article
            key={post.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              overflow: "hidden"
            }}
          >
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover"
                }}
              />
            )}

            <p style={{
              padding: 10,
              fontSize: 13,
              overflowWrap: "anywhere"
            }}>
              {post.caption}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
