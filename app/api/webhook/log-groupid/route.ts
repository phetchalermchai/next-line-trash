import { NextRequest, NextResponse } from "next/server";

// เก็บ log group id ชั่วคราว (รีสตาร์ท server หาย)
const logs: { source: "line" | "telegram", time: number, groupId: string, detail: any }[] = [];

export async function POST(req: NextRequest) {
    const body = await req.json();

    // LINE Webhook event
    if (body.events) {
        for (const ev of body.events) {
            if (ev.source?.groupId) {
                logs.unshift({
                    source: "line",
                    time: Date.now(),
                    groupId: ev.source.groupId,
                    detail: ev,
                });
            }
        }
        return NextResponse.json({ ok: true });
    }

    // TELEGRAM Webhook event
    if (body.message?.chat?.id && ["group", "supergroup"].includes(body.message.chat.type)) {
        logs.unshift({
            source: "telegram",
            time: Date.now(),
            groupId: String(body.message.chat.id),
            detail: body.message,
        });
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Not a supported event" }, { status: 400 });
}

// For GET: เรียก logs ย้อนหลัง
export async function GET() {
    return NextResponse.json(logs.slice(0, 30));
}