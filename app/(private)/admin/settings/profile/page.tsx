"use client";

import AccountApiKey from "@/components/settings/AccountApiKey";
import AccountLinkingPage from "@/components/settings/AccountLinking";

const page = () => {
  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-10">
      <AccountLinkingPage/>
      <AccountApiKey/>
    </div>
  )
}

export default page