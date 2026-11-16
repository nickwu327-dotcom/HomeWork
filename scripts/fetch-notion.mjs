// 從 Notion「作業」資料庫讀取作業，寫入 data.json（由 GitHub Actions 執行）
import { writeFileSync } from "node:fs";

const token = process.env.NOTION_TOKEN;
const dbId = process.env.NOTION_DATABASE_ID || "41af8f7dfd798153bfe6e89c48cd7d2e";
if (!token) { console.error("缺少 NOTION_TOKEN"); process.exit(1); }

const text = arr => (arr || []).map(t => t.plain_text).join("");
const items = [];
let cursor;
do {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
  });
  if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
  const data = await res.json();
  for (const p of data.results) {
    const pr = p.properties;
    items.push({
      id: p.id,
      date: pr["日期"]?.date?.start || "",
      kid: pr["孩子"]?.select?.name || "",
      cls: pr["班別"]?.select?.name || "",
      text: text(pr["內容"]?.title),
    });
  }
  cursor = data.has_more ? data.next_cursor : undefined;
} while (cursor);

items.sort((a, b) => a.date.localeCompare(b.date));
writeFileSync("data.json", JSON.stringify({ items }, null, 2) + "\n");
console.log(`寫入 ${items.length} 筆作業`);
