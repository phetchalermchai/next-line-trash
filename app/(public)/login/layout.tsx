import { Suspense } from "react";

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <main>{children}</main>
        </Suspense>
    )
}