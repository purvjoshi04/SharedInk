"use client"
import { useRouter } from "next/navigation";
import styles from "./page.module.css"
import { useState } from "react";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  // TODO: use react-hook-form
  return (
      <div className={styles.page}>
        <input value={roomId} onChange={(e) => {
          setRoomId(e.target.value);
        }} type="text" placeholder="Room id" />
        <button onClick={() => {
          router.push(`/room/${roomId}`)
        }}>Join room</button>
      </div>
  );
}