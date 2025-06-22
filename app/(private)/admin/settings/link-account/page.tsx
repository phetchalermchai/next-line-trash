"use client";

import { useSession } from "next-auth/react";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Link2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface LinkedProvider {
  provider: string;
  providerAccountId: string;
}

export default function AccountLinkingPage() {
  const { data: session } = useSession();
  const [linked, setLinked] = useState<LinkedProvider[]>([]);
  const [providers, setProviders] = useState<Record<string, any>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      if (!session?.user?.id) return;
      const res = await axios.get("/api/user/linked-accounts");
      setLinked(res.data);
    };

    const fetchProviders = async () => {
      const p = await getProviders();
      setProviders(p || {});
    };

    fetchLinkedAccounts();
    fetchProviders();
  }, [session]);

  const isLinked = (provider: string) =>
    linked.some((acc) => acc.provider === provider);

  const handleLink = async (providerId: string) => {
    const userId = session?.user?.id;
    if (!userId) return;
    signIn(providerId, {
      callbackUrl: `/link-account/callback?provider=${providerId}&linkingUserId=${userId}`,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">ผูกบัญชีเพิ่มเติม</h2>
      <Card>
        <CardContent className="space-y-4 p-6">
          {Object.values(providers).map((provider) => (
            <div key={provider.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{provider.name}</span>
                {isLinked(provider.id) && (
                  <CheckCircle className="text-green-500 w-4 h-4" />
                )}
              </div>
              {!isLinked(provider.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLink(provider.id)}
                >
                  <Link2 className="w-4 h-4 mr-1" /> ผูกบัญชี
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
