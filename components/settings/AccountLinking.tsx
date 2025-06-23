"use client";

import { useSession } from "next-auth/react";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Link2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface LinkedProvider {
  provider: string;
  providerAccountId: string;
}

export default function AccountLinkingPage() {
  const { data: session } = useSession();
  const [linked, setLinked] = useState<LinkedProvider[]>([]);
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

  const fetchLinkedAccounts = async () => {
    if (!session?.user?.id) return;
    const res = await axios.get("/api/user/linked-accounts");
    setLinked(res.data);
  };

  useEffect(() => {
    fetchLinkedAccounts();
    getProviders().then((p) => setProviders(p || {}));
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

  const handleUnlink = async () => {
    if (!confirmUnlink) return;
    try {
      await axios.post("/api/user/unlink-account", { provider: confirmUnlink });
      toast.success("ถอดบัญชีเรียบร้อยแล้ว");
      fetchLinkedAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "ถอดบัญชีไม่สำเร็จ");
    } finally {
      setConfirmUnlink(null);
    }
  };

  const providerIcons: Record<string, ReactNode> = {
    google: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="25" height="25">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>),
    facebook: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="25" height="25">
      <path
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
        fill="currentColor"
      />
    </svg>),
    line: (<svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="25"
      viewBox="0 0 48 48"
    >
      <path d="M23.008 5c-2.577 0-5.053.383-7.344 1.086a1.5 1.5 0 1 0 .88 2.867A22 22 0 0 1 23.009 8c10.094 0 17.998 6.568 17.998 14.236 0 3.732-1.667 6.863-4.393 9.74a1.5 1.5 0 1 0 2.178 2.063c3.066-3.236 5.215-7.16 5.215-11.803C44.006 12.551 34.416 5 23.008 5M7.236 11.516a1.5 1.5 0 0 0-1.154.515c-2.535 2.826-4.076 6.372-4.076 10.205 0 8.638 7.601 15.649 17.5 16.996.228.05.471.13.627.198-.015.085.02.481-.028.843v.002c-.012.077-.224 1.34-.27 1.604l.003-.002c-.075.433-.316 1.157.355 2.172.336.507 1.092.939 1.77.951s1.246-.21 1.869-.553c2.854-1.57 5.864-3.27 8.672-5.191a1.5 1.5 0 1 0-1.693-2.477c-2.488 1.702-5.213 3.238-7.868 4.705l.13-.765.007-.047c.075-.563.285-1.407-.156-2.51l-.002-.004c-.334-.825-.951-1.183-1.445-1.42a6 6 0 0 0-1.35-.441 2 2 0 0 0-.12-.02c-8.788-1.156-15.001-7.153-15.001-14.04 0-3.035 1.2-5.85 3.31-8.204a1.5 1.5 0 0 0-1.08-2.517m11.098 5.62a1.02 1.02 0 0 0-1.023 1.016v7.694a1.02 1.02 0 0 0 1.023 1.015 1.02 1.02 0 0 0 1.023-1.015v-7.694a1.02 1.02 0 0 0-1.023-1.015m3.52 0q-.166 0-.327.053c-.418.14-.699.526-.699.963v7.694c0 .56.46 1.015 1.026 1.015s1.025-.455 1.025-1.015v-4.758l3.975 5.367a1.03 1.03 0 0 0 1.142.354c.42-.137.701-.524.701-.963V18.15c0-.56-.458-1.013-1.023-1.013a1.02 1.02 0 0 0-1.026 1.013v4.762l-3.976-5.369a1.03 1.03 0 0 0-.818-.406m-10.387.003a1.02 1.02 0 0 0-1.024 1.013v7.696a1.02 1.02 0 0 0 1.024 1.015h3.879a1.02 1.02 0 0 0 1.021-1.017c0-.56-.456-1.016-1.021-1.016h-2.858v-6.678c0-.56-.456-1.013-1.021-1.013m19.629 0a1.02 1.02 0 0 0-1.024 1.015v7.692c0 .56.46 1.015 1.024 1.015h3.879c.565 0 1.025-.455 1.025-1.015s-.46-1.016-1.025-1.016h-2.856v-1.816h2.856c.566 0 1.025-.456 1.025-1.016 0-.561-.46-1.016-1.025-1.016v.004h-2.856V19.17h2.856c.566 0 1.025-.456 1.025-1.016s-.46-1.015-1.025-1.015z"
        fill="currentColor" />
    </svg>)
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">ผูกบัญชีเพิ่มเติม</h2>
      <Card className="shadow-xl">
        <CardContent className="space-y-4 p-6">
          {Object.values(providers).map((provider) => (
            <div
              key={provider.id}
              className="flex justify-between items-center border rounded-lg p-3 hover:bg-muted/50 transition gap-4"
            >
              <div className="flex items-center gap-3">
                {providerIcons[provider.id] || <Link2 className="w-5 h-5" />}
                <span className="font-medium capitalize">{provider.name}</span>
                {isLinked(provider.id) && (
                  <CheckCircle className="text-green-500 w-4 h-4" />
                )}
              </div>
              {isLinked(provider.id) ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmUnlink(provider.id)}
                      className="cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> ถอดบัญชี
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" /> ยืนยันการถอดบัญชี
                      </DialogTitle>
                    </DialogHeader>
                    <p>คุณแน่ใจหรือไม่ว่าต้องการถอดบัญชี {provider.name} ออกจากระบบ?</p>
                    <DialogFooter className="mt-4">
                      <Button variant="secondary" onClick={() => setConfirmUnlink(null)}>
                        ยกเลิก
                      </Button>
                      <Button variant="destructive" onClick={handleUnlink}>
                        ยืนยันการถอด
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLink(provider.id)}
                  className="cursor-pointer"
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