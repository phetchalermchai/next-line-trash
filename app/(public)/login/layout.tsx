import { Suspense } from "react";
import SkeletonLoginPage from "./SkeletonLoginPage";

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={<SkeletonLoginPage />}>
            <main>{children}</main>
        </Suspense>
    )
}