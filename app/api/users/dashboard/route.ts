// file: app/api/users/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth } from "date-fns";

export async function GET() {
    // ดึงข้อมูลรวม
    const [totalUsers, approvedUsers, pendingUsers, bannedUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "APPROVED" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { status: "BANNED" } }),
    ]);

    // ดึงข้อมูล signupTrend 6 เดือนย้อนหลัง
    const signupTrend = await Promise.all(
        Array.from({ length: 6 }).map(async (_, i) => {
            const from = startOfMonth(subMonths(new Date(), 5 - i));
            const to = startOfMonth(subMonths(new Date(), 4 - i));
            const count = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: from,
                        lt: to,
                    },
                },
            });
            const month = from.toLocaleString("th-TH", { month: "short" });
            return { month, count };
        })
    );

    // ดึงข้อมูล provider จาก Account
    const providersRaw = await prisma.account.groupBy({
        by: ["provider"],
        _count: true,
    });
    const providers = providersRaw
        .map((p) => ({ provider: p.provider, count: p._count }))
        .sort((a, b) => b.count - a.count);

    // Recent users
    const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });

    // นับจำนวนผู้ใช้ตาม role
    const [adminUsers, superadminUsers] = await Promise.all([
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "SUPERADMIN" } }),
    ]);

    // ผู้ใช้ที่สมัครในเดือนนี้
    const startOfCurrentMonth = startOfMonth(new Date());
    const newUsersThisMonth = await prisma.user.count({
        where: {
            createdAt: {
                gte: startOfCurrentMonth,
            },
        },
    });

    // ผู้ใช้ที่ไม่มีบัญชี OAuth
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            accounts: { select: { id: true } },
        },
    });

    const usersWithoutLinkedAccount = allUsers.filter((user) => user.accounts.length === 0);

    return NextResponse.json({
        totalUsers,
        approvedUsers,
        pendingUsers,
        bannedUsers,
        adminUsers,
        superadminUsers,
        newUsersThisMonth,
        signupTrend,
        providers,
        recentUsers,
        usersWithoutLinkedAccount,
    }, {
        headers: {
            "Cache-Control": "public, max-age=60", // cache 60 วินาที
        },
    });
}
