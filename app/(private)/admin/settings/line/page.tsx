"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function SettingPage() {
  const { data: session } = useSession();
  const [groupId, setGroupId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const groupRes = await axios.get("/api/settings?key=LINE_GROUP_ID");
      const tokenRes = await axios.get("/api/settings?key=LINE_ACCESS_TOKEN");

      setGroupId(groupRes.data?.value || "");
      setAccessToken(tokenRes.data?.value || "");
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    await axios.put("/api/settings", { key: "LINE_GROUP_ID", value: groupId });
    await axios.put("/api/settings", { key: "LINE_ACCESS_TOKEN", value: accessToken });
    alert("บันทึกสำเร็จ");
  }

  if (session?.user?.role !== "SUPERADMIN") {
    return <p>Unauthorized</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">ตั้งค่า LINE Notification</h1>

      <label className="block mb-2">LINE_GROUP_ID</label>
      <input
        type="text"
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <label className="block mb-2">LINE_ACCESS_TOKEN</label>
      <input
        type="text"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        บันทึก
      </button>
    </div>
  );
}