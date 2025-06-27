import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserTableSkeleton({ isMobile }: { isMobile: boolean }) {
    const items = Array.from({ length: 5 });

    return (
        <div className="space-y-4 mt-6">
            {!isMobile ? (
                <div className="rounded-md border">
                    <div className="p-4">
                        <Skeleton className="h-6 w-1/4 mb-4" />
                        {items.map((_, idx) => (
                            <div key={idx} className="flex justify-between py-2 border-b">
                                <Skeleton className="h-4 w-[20%]" />
                                <Skeleton className="h-4 w-[25%]" />
                                <Skeleton className="h-4 w-[15%]" />
                                <Skeleton className="h-4 w-[15%]" />
                                <Skeleton className="h-4 w-[20%]" />
                                <Skeleton className="h-4 w-6" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {items.map((_, idx) => (
                        <Card key={idx} className="shadow">
                            <CardContent className="pt-4 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


export function UserSearchSkeleton() {
    return (
        <div className="space-y-3 mb-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[160px]" />
                <Skeleton className="h-10 w-[160px]" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-10 w-[140px]" />
            </div>
        </div>
    )
}
