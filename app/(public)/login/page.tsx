import { GalleryVerticalEnd, LogIn } from "lucide-react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-muted min-h-svh flex flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <span className="flex flex-col items-center gap-2 self-center font-medium text-primary text-lg">
          <span className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-5" />
            </div>
            ระบบร้องเรียนปัญหาขยะ
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            สำนักสาธารณสุขและสิ่งแวดล้อม เทศบาลนครนนทบุรี
          </span>
        </span>
        <LoginForm />
      </div>
    </div>
  );
}