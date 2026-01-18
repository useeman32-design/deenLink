const fs = require("fs");
const path = require("path");

const RAW_DIR = "./data/hadith/raw";
const OUT_DIR = "./data/hadith/processed";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function normalizeBook(bookFolder) {
  const bookPath = path.join(RAW_DIR, bookFolder);
  const files = fs.readdirSync(bookPath);

  let normalizedHadiths = [];

  files.forEach(file => {
    if (!file.endsWith(".json")) return;

    const chapterNumber = parseInt(file.replace(".json", ""));
    const rawData = JSON.parse(
      fs.readFileSync(path.join(bookPath, file), "utf8")
    );

    const chapterName =
      rawData.chapter ||
      rawData.chapter_title ||
      `Chapter ${chapterNumber}`;

    const hadithList =
      rawData.hadiths ||
      rawData.data ||
      rawData.hadith ||
      [];

    hadithList.forEach(h => {
      normalizedHadiths.push({
        collection: bookFolder.replace(/_/g, " "),
        chapter_number: chapterNumber,
        chapter_name: chapterName,
        hadith_number: h.hadithnumber || h.number || null,
        arabic: h.arabic || h.text_ar || "",
        english: h.english || h.text_en || "",
        grade: h.grade || h.status || "Unknown"
      });
    });
  });

  fs.writeFileSync(
    path.join(OUT_DIR, `${bookFolder}.json`),
    JSON.stringify(normalizedHadiths, null, 2)
  );

  console.log(`✅ Normalized ${bookFolder}`);
}

// Run for all books
fs.readdirSync(RAW_DIR).forEach(bookFolder => {
  if (fs.statSync(path.join(RAW_DIR, bookFolder)).isDirectory()) {
    normalizeBook(bookFolder);
  }
});
