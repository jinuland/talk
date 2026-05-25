"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function FollowButton({ tutorId, initialFollowing }: { tutorId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, action: following ? "unfollow" : "follow" }),
    });
    setLoading(false);
    if (res.ok) setFollowing(!following);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={following ? "btn-outline" : "btn-primary"}
    >
      <Heart size={16} className={following ? "fill-current" : ""} />
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}
