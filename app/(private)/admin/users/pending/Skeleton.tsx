import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const PendingUserSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardContent className="space-y-2 py-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

export const TableSkeleton = ({ columns }: { columns: number }) => (
    <div className="rounded-md border overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    {[...Array(columns)].map((_, i) => (
                        <TableHead key={i}>
                            <Skeleton className="h-4 w-24" />
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(3)].map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {[...Array(columns)].map((_, colIndex) => (
                            <TableCell key={colIndex}>
                                <Skeleton className="h-4 w-full" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);