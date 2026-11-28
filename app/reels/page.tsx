
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Volume2,
  VolumeX,
  ArrowLeft,
  Play,
  Trash2,
} from "lucide-react";

type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
};

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [userId, setUserId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<string[]>([]);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"reels" | "following">("reels");
  const [message, setMessage] = useState("");

  async function loadReels() {
    if (!supabase) {
      setMessage("Supabase configuration missing.");
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;

    setUserId(currentUser?.id || "");

    const { data, error } = await supabase
      .from("reels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setReels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReels();
  }, []);

  async function publishReel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase || !userId) {
      setMessage("Reel share karne ke liye login karo.");
      return;
    }

    if (!videoUrl.trim()) {
      setMessage("Video URL daalo.");
      return;
    }

    setPosting(true);
    setMessage("");

    const { error } = await supabase.from("reels").insert({
      user_id: userId,
      video_url: videoUrl.trim(),
      caption: caption.trim(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setVideoUrl("");
      setCaption("");
      setShowUpload(false);
      await loadReels();
    }

    setPosting(false);
  }

  async function deleteReel(id: string) {
    if (!supabase || !confirm("Kya tum ye Reel delete karna chahte ho?")) {
      return;
    }

    const { error } = await supabase
      .from("reels")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
    } else {
      setReels((old) => old.filter((reel) => reel.id !== id));
    }
  }

  function toggleLike(id: string) {
    setLiked((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  }

  async function shareReel(reel: Reel) {
    const url = `${window.location.origin}/reels`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "NexaGram Reel",
          text: reel.caption || "Watch this Reel on NexaGram!",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied!");
      }
    } catch {
      setMessage("Sharing cancelled.");
    }
  }

  return (
    <main className="reels-page">
      <header className="reels-header">
        <Link href="/" className="back-button">
          <ArrowLeft size={22} />
        </Link>

        <Link href="/" className="reels-logo">
          NexaGram
        </Link>

        <div className="header-tabs">
          <button
            className={activeTab === "reels" ? "selected" : ""}
            onClick={() => setActiveTab("reels")}
          >
            Reels
          </button>

          <button
            className={activeTab === "following" ? "selected" : ""}
            onClick={() => setActiveTab("following")}
          >
            Following
          </button>
        </div>

        <button
          className="upload-button"
          onClick={() => setShowUpload(true)}
          aria-label="Create Reel"
        >
          <Plus size={22} />
          <span>Create</span>
        </button>
      </header>

      {message && (
        <div className="reels-message">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <section className="reels-feed">
        {loading ? (
          <div className="empty-state">
            <div className="loader" />
            <p>Loading Reels...</p>
          </div>
        ) : reels.length === 0 ? (
          <div className="empty-state">
            <Play size={55} />
            <h2>No Reels yet</h2>
            <p>Be the first to share a video on NexaGram.</p>
            <button
              className="primary-button"
              onClick={() => setShowUpload(true)}
            >
              <Plus size={19} /> Create your first Reel
            </button>
          </div>
        ) : (
          reels
            .filter((reel) =>
              activeTab === "following"
                ? reel.user_id === userId
                : true
            )
            .map((reel) => (
              <article className="reel-card" key={reel.id}>
                <video
                  className="reel-video"
                  src={reel.video_url}
                  autoPlay
                  muted={muted}
                  loop
                  playsInline
                  controls
                  preload="metadata"
                />

                <div className="video-shade" />

                <div className="reel-top-label">
                  <span>NexaGram</span>
                  <span>•</span>
                  <span>Reels</span>
                </div>

                <div className="reel-details">
                  <div className="creator-row">
                    <div className="creator-avatar">N</div>
                    <strong>
                      {reel.user_id === userId
                        ? "You"
                        : `Creator ${reel.user_id.slice(0, 6)}`}
                    </strong>
                    <span className="creator-badge">Creator</span>
                  </div>

                  <p>{reel.caption || "Enjoy this Reel!"}</p>
                  <div className="music-line">
                    <span>♫</span> Original audio · NexaGram
                  </div>
                </div>

                <div className="reel-actions">
                  <button
                    onClick={() => toggleLike(reel.id)}
                    aria-label="Like Reel"
                  >
                    <Heart
                      size={30}
                      fill={liked.includes(reel.id) ? "white" : "none"}
                    />
                    <span>{liked.includes(reel.id) ? "Liked" : "Like"}</span>
                  </button>

                  <button
                    onClick={() =>
                      setMessage("Reel comments will be added in the next update.")
                    }
                    aria-label="Comments"
                  >
                    <MessageCircle size={30} />
                    <span>Comment</span>
                  </button>

                  <button
                    onClick={() => shareReel(reel)}
                    aria-label="Share Reel"
                  >
                    <Share2 size={29} />
                    <span>Share</span>
                  </button>

                  {reel.user_id === userId && (
                    <button
                      onClick={() => deleteReel(reel.id)}
                      aria-label="Delete Reel"
                    >
                      <Trash2 size={27} />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    onClick={() => setMuted((old) => !old)}
                    aria-label="Toggle sound"
                  >
                    {muted ? (
                      <VolumeX size={27} />
                    ) : (
                      <Volume2 size={27} />
                    )}
                    <span>Sound</span>
                  </button>
                </div>
              </article>
            ))
        )}
      </section>

      <nav className="reels-bottom-nav">
        <Link href="/">Home</Link>
        <Link href="/explore">Explore</Link>
        <button onClick={() => setShowUpload(true)}>
          <Plus size={23} />
        </button>
        <Link href="/reels" className="nav-active">Reels</Link>
        <Link href="/profile">Profile</Link>
      </nav>

      {showUpload && (
        <div
          className="upload-overlay"
          onClick={() => setShowUpload(false)}
        >
          <form
            className="upload-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={publishReel}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowUpload(false)}
            >
              ×
            </button>

            <h2>Create a Reel</h2>
            <p>Share a short video with the NexaGram community.</p>

            <label>Video URL</label>
            <input
              type="url"
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />

            <label>Caption</label>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />

            <button
              type="submit"
              className="primary-button publish-button"
              disabled={posting}
            >
              {posting ? "Publishing..." : "Publish Reel"}
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .reels-page {
          min-height: 100vh;
          background: #090909;
          color: white;
          font-family: Arial, sans-serif;
        }

        .reels-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background: #090909;
          border-bottom: 1px solid #252525;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .back-button,
        .reels-logo {
          color: white;
          text-decoration: none;
        }

        .reels-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .header-tabs {
          display: flex;
          gap: 20px;
        }

        .header-tabs button {
          background: none;
          border: none;
          color: #888;
          font-size: 15px;
          padding: 10px 0;
          cursor: pointer;
        }

        .header-tabs button.selected {
          color: white;
          border-bottom: 2px solid white;
          font-weight: bold;
        }

        .upload-button,
        .primary-button {
          background: white;
          color: black;
          border: none;
          border-radius: 8px;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-weight: bold;
          cursor: pointer;
        }

        .reels-feed {
          min-height: calc(100vh - 125px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 12px;
          gap: 20px;
        }

        .reel-card {
          width: min(100%, 430px);
          height: min(78vh, 760px);
          min-height: 500px;
          position: relative;
          overflow: hidden;
          background: #171717;
          border-radius: 15px;
          scroll-snap-align: center;
        }

        .reel-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: black;
        }

        .video-shade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,.35),
            transparent 25%,
            transparent 55%,
            rgba(0,0,0,.7)
          );
        }

        .reel-top-label {
          position: absolute;
          top: 18px;
          left: 17px;
          display: flex;
          gap: 8px;
          font-weight: bold;
          text-shadow: 0 2px 5px black;
        }

        .reel-details {
          position: absolute;
          bottom: 20px;
          left: 16px;
          right: 75px;
          text-shadow: 0 1px 5px black;
        }

        .creator-row {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 12px;
        }

        .creator-avatar {
          width: 37px;
          height: 37px;
          border: 2px solid white;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: bold;
        }

        .creator-badge {
          font-size: 10px;
          border: 1px solid #ddd;
          padding: 4px 7px;
          border-radius: 20px;
        }

        .reel-details p {
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .music-line {
          font-size: 12px;
          margin-top: 12px;
        }

        .reel-actions {
          position: absolute;
          right: 12px;
          bottom: 25px;
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .reel-actions button {
          background: transparent;
          color: white;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          text-shadow: 0 2px 5px black;
        }

        .reel-actions span {
          font-size: 10px;
        }

        .empty-state {
          min-height: 65vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 14px;
          color: #ddd;
        }

        .empty-state p {
          color: #999;
        }

        .empty-state h2 {
          margin: 0;
        }

        .primary-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .reels-bottom-nav {
          min-height: 60px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: #090909;
          border-top: 1px solid #252525;
          position: sticky;
          bottom: 0;
          z-index: 20;
        }

        .reels-bottom-nav a,
        .reels-bottom-nav button {
          color: #aaa;
          text-decoration: none;
          background: none;
          border: none;
          font-size: 12px;
          cursor: pointer;
        }

        .reels-bottom-nav .nav-active {
          color: white;
          font-weight: bold;
        }

        .reels-bottom-nav button {
          color: white;
        }

        .upload-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0,0,0,.8);
          display: grid;
          place-items: center;
          padding: 16px;
        }

        .upload-modal {
          position: relative;
          background: #171717;
          color: white;
          border: 1px solid #333;
          border-radius: 15px;
          padding: 28px;
          width: min(100%, 440px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .upload-modal h2 {
          margin: 0;
        }

        .upload-modal p {
          color: #aaa;
          font-size: 13px;
        }

        .upload-modal label {
          font-size: 13px;
          font-weight: bold;
        }

        .upload-modal input,
        .upload-modal textarea {
          width: 100%;
          box-sizing: border-box;
          background: #090909;
          border: 1px solid #444;
          color: white;
          padding: 12px;
          border-radius: 7px;
          font: inherit;
        }

        .upload-modal textarea {
          resize: vertical;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          right: 14px;
          background: none;
          color: white;
          border: none;
          font-size: 27px;
          cursor: pointer;
        }

        .publish-button {
          margin-top: 8px;
        }

        .reels-message {
          padding: 10px;
          text-align: center;
          color: white;
          background: #252525;
        }

        .reels-message button {
          margin-left: 12px;
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid #555;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .reels-header {
            height: 55px;
            padding: 0 12px;
          }

          .reels-logo {
            font-size: 18px;
          }

          .header-tabs {
            gap: 12px;
          }

          .header-tabs button {
            font-size: 13px;
          }

          .upload-button {
            padding: 8px;
          }

          .upload-button span {
            display: none;
          }

          .reels-feed {
            padding: 0;
            gap: 0;
            min-height: calc(100dvh - 115px);
          }

          .reel-card {
            width: 100%;
            height: calc(100dvh - 115px);
            min-height: 450px;
            border-radius: 0;
          }

          .reels-bottom-nav {
            min-height: 60px;
          }
        }
      `}</style>
    </main>
  );
}
