
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

export default function MessagesPage() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadPeople() {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNotice("Please login first.");
        return;
      }

      setCurrentUser(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id,username")
        .neq("id", user.id)
        .order("username");

      if (error) setNotice(error.message);
      else setPeople((data || []) as Profile[]);
    }

    loadPeople();
  }, []);

  async function loadMessages(personId: string) {
    if (!supabase || !currentUser) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser},receiver_id.eq.${personId}),and(sender_id.eq.${personId},receiver_id.eq.${currentUser})`
      )
      .order("created_at", { ascending: true });

    if (error) setNotice(error.message);
    else setMessages((data || []) as Message[]);
  }

  async function choosePerson(personId: string) {
    setSelected(personId);
    await loadMessages(personId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !selected || !body.trim()) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser,
      receiver_id: selected,
      body: body.trim(),
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    setBody("");
    await loadMessages(selected);
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
      <h1>Private Messages</h1>
      {notice && <p>{notice}</p>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(150px, 1fr) 2fr",
        gap: 15
      }}>
        <section>
          <h3>People</h3>
          {people.map((person) => (
            <button
              key={person.id}
              onClick={() => choosePerson(person.id)}
              style={{
                display: "block",
                width: "100%",
                padding: 12,
                marginBottom: 8,
                background: selected === person.id ? "#eee" : "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                textAlign: "left"
              }}
            >
              @{person.username}
            </button>
          ))}
        </section>

        <section>
          <h3>Conversation</h3>

          <div style={{
            minHeight: 300,
            maxHeight: 450,
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12
          }}>
            {!selected && <p>Select a person to chat.</p>}

            {messages.map((message) => (
              <div key={message.id} style={{
                textAlign: message.sender_id === currentUser ? "right" : "left",
                marginBottom: 12
              }}>
                <span style={{
                  display: "inline-block",
                  padding: 10,
                  borderRadius: 10,
                  background: message.sender_id === currentUser ? "#eee" : "#f7f7f7",
                  overflowWrap: "anywhere"
                }}>
                  {message.body}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{
            display: "flex",
            gap: 8,
            marginTop: 12
          }}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message..."
              maxLength={4000}
              disabled={!selected}
              style={{ flex: 1, minWidth: 0, padding: 12 }}
            />
            <button disabled={!selected || !body.trim()}>
              Send
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
