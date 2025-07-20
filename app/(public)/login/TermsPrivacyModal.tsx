"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog"

export function TermsPrivacyModal({ type }: { type: "terms" | "privacy" }) {
  const [open, setOpen] = useState(false)
  const title = type === "terms" ? "เงื่อนไขการใช้งาน" : "นโยบายความเป็นส่วนตัว"
  const desc =
    type === "terms"
      ? "โปรดอ่านข้อตกลงการใช้งานก่อนเข้าใช้งานระบบ"
      : "โปรดอ่านนโยบายความเป็นส่วนตัวก่อนเข้าใช้งานระบบ"

  const content =
    type === "terms" ? (
      <section className="text-sm space-y-3">
        <h2 className="font-bold mb-1">ข้อตกลงการใช้งาน</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>
            <b>ข้อตกลงการใช้งาน</b> <br />
            การเข้าใช้งานระบบนี้ถือว่าคุณยอมรับข้อตกลงและเงื่อนไขทุกประการของ{" "}
            <b>เทศบาลนครนนทบุรี สำนักสาธารณสุขและสิ่งแวดล้อม</b>
          </li>
          <li>
            <b>ขอบเขตการให้บริการ</b> <br />
            ใช้สำหรับร้องเรียน แจ้งปัญหา และบริการที่เกี่ยวข้องในเขตเทศบาลฯ
            อาจมีการเปลี่ยนแปลง/ระงับบริการโดยไม่ต้องแจ้งล่วงหน้า
          </li>
          <li>
            <b>สิทธิ์และหน้าที่ผู้ใช้</b>
            <ul className="list-disc ml-5 mt-1">
              <li>ต้องกรอกข้อมูลจริง ไม่ใช้ถ้อยคำหมิ่นประมาทหรือผิดกฎหมาย</li>
              <li>ห้ามใช้งานเพื่อ spam/ก่อกวน/แฮกข้อมูล ฯลฯ</li>
              <li>เทศบาลฯ มีสิทธิ์ลบ/ระงับบัญชีหรือข้อมูลที่ไม่เหมาะสม</li>
            </ul>
          </li>
          <li>
            <b>ข้อจำกัดความรับผิด</b>
            <br />
            เทศบาลฯ จะดูแลระบบให้ใช้งานได้ แต่ไม่รับประกันความถูกต้องหรือความต่อเนื่องของบริการ และขอปฏิเสธความรับผิดในความเสียหายที่เกิดขึ้น (เท่าที่กฎหมายอนุญาต)
          </li>
          <li>
            <b>ลิขสิทธิ์</b>
            <br />
            ข้อมูล/เนื้อหาในระบบเป็นทรัพย์สินทางปัญญาของเทศบาลฯ ห้ามนำไปใช้/เผยแพร่โดยไม่ได้รับอนุญาต
          </li>
          <li>
            <b>การปรับปรุงเงื่อนไข</b>
            <br />
            เทศบาลฯ สามารถปรับปรุงเงื่อนไขนี้ได้โดยไม่ต้องแจ้งล่วงหน้า ผู้ใช้ควรตรวจสอบเป็นระยะ
          </li>
        </ol>
        <div className="text-xs text-muted-foreground mt-3">
          สอบถามเพิ่มเติม โทร. 0 2589 0500 ต่อ 1202
        </div>
      </section>
    ) : (
      <section className="text-sm space-y-3">
        <h2 className="font-bold mb-1">นโยบายความเป็นส่วนตัว (PDPA)</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>
            <b>การเก็บข้อมูลส่วนบุคคล</b>
            <br />
            ระบบจะเก็บข้อมูลเท่าที่จำเป็น เช่น ชื่อ เบอร์โทร อีเมล รายละเอียดร้องเรียน ตำแหน่งที่ตั้ง ฯลฯ เพื่อการบริการและการดำเนินงานเท่านั้น
          </li>
          <li>
            <b>วัตถุประสงค์การใช้ข้อมูล</b>
            <ul className="list-disc ml-5 mt-1">
              <li>เพื่อรับและดำเนินการตามเรื่องร้องเรียน</li>
              <li>แจ้งผลความคืบหน้า</li>
              <li>ปรับปรุงพัฒนาระบบบริการ</li>
              <li>ตรวจสอบ สถิติ หรือรายงานภายใน</li>
            </ul>
          </li>
          <li>
            <b>การจัดเก็บ/ระยะเวลาการเก็บ</b>
            <br />
            ข้อมูลจะถูกจัดเก็บอย่างปลอดภัยตามมาตรฐาน เทศบาลฯ จะลบ/ทำลายข้อมูลเมื่อหมดความจำเป็น
          </li>
          <li>
            <b>การเปิดเผยข้อมูล</b>
            <br />
            เทศบาลฯ จะไม่เปิดเผยข้อมูลให้บุคคลภายนอก เว้นแต่ได้รับความยินยอมหรือมีกฎหมายกำหนด
          </li>
          <li>
            <b>สิทธิ์ของเจ้าของข้อมูล</b>
            <ul className="list-disc ml-5 mt-1">
              <li>ขอเข้าถึง/ตรวจสอบ/แก้ไข/ลบข้อมูลส่วนบุคคลของตนเอง</li>
              <li>ถอนความยินยอมได้ทุกเมื่อ (อาจมีผลต่อการใช้บริการ)</li>
              <li>ขอรับข้อมูลในรูปแบบอิเล็กทรอนิกส์</li>
            </ul>
            <span className="font-medium text-primary">
              ช่องทางติดต่อ: 0 2589 0500 ต่อ 1202
            </span>
          </li>
          <li>
            <b>มาตรการคุ้มครองข้อมูล</b>
            <br />
            เทศบาลฯ ใช้มาตรการทางเทคนิคและการจัดการเพื่อป้องกันข้อมูลรั่วไหล เข้าถึงโดยไม่ได้รับอนุญาต หรือถูกทำลาย
          </li>
          <li>
            <b>การปรับปรุงนโยบาย</b>
            <br />
            เทศบาลฯ ขอสงวนสิทธิ์ในการปรับปรุงนโยบายนี้โดยไม่ต้องแจ้งล่วงหน้า โปรดตรวจสอบเป็นระยะ
          </li>
        </ol>
        <div className="text-xs text-muted-foreground mt-3">
          หากมีข้อสงสัยเกี่ยวกับข้อมูลส่วนบุคคล กรุณาติดต่อ 0 2589 0500 ต่อ 1202
        </div>
      </section>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="underline underline-offset-2 text-primary hover:text-primary/80 transition text-xs cursor-pointer"
        >
          {title}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {desc}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
