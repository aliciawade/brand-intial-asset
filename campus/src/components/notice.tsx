import { noticeText } from "@/lib/notices";

export function Notice({ notice }: { notice: unknown }) {
  const text = noticeText(notice);
  if (!text) return null;
  return <p className="notice" role="status">{text}</p>;
}
