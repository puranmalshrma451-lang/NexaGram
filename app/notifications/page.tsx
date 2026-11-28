
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  actor_id: string | null;
  kind: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [notice, setNotice] = useState("Loading notifications...");

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

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setNotice(error.message);
        return;
      }

      setItems((data || []) as Notification[]);
      setNotice(data?.length ? "" : "No notifications yet.");
    }

    load();
  }, []);

  async function markRead(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  }

  return (
    <main style={{
      maxWidth: 700,
      margin: "25px auto",
      padding: 20,
      color: "#111",
      fontFamily: "Arial, sans-serif"
    }}>
      <Link href="/">← Back to Home</Link>

      <h1>Notifications</h1>

      {notice && <p>{notice}</p>}

      {items.map((item) => (
        <article key={item.id} style={{
          padding: 15,
          marginBottom: 10,
          border: "1px solid #ddd",
          borderRadius: 9,
          background: item.is_read ? "white" : "#f5f5f5"
        }}>
          <b>
            {item.kind === "like" && "Someone liked your post"}
            {item.kind === "comment" && "Someone commented on your post"}
            {item.kind === "follow" && "Someone followed you"}
          </b>

          <p style={{ color: "#777", fontSize: 13 }}>
            {new Date(item.created_at).toLocaleString()}
          </p>

          {!item.is_read && (
            <button onClick={() => markRead(item.id)}>
              Mark as read
            </button>
          )}
        </article>
      ))}
    </main>
  );
}
