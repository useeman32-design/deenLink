const fs = require("fs");

// Load files
const arabicFile = fs.readFileSync("./data/quran/raw/quran-uthmani.txt", "utf8")
  .split("\n").filter(l => l.trim() !== "");
const englishFile = fs.readFileSync("./data/quran/raw/en.sahih.txt", "utf8")
  .split("\n").filter(l => l.trim() !== "");
const hausaFile = fs.readFileSync("./data/quran/raw/ha.gumi.txt", "utf8")
  .split("\n").filter(l => l.trim() !== "");

const BASMALLAH_REGEX = /بِسْمِ[\u0600-\u06FF\s]+ٱللَّهِ[\u0600-\u06FF\s]+ٱلرَّحِيمِ/;

let surahs = {};

for (let i = 0; i < arabicFile.length; i++) {
    if (!englishFile[i] || !hausaFile[i]) {
        console.log(`Skipping line ${i+1}: missing translation`);
        continue;
    }

    const [sAr, aAr, textArRaw] = arabicFile[i].split("|");
    const [sEn, , textEn] = englishFile[i].split("|");
    const [sHa, , textHa] = hausaFile[i].split("|");

    const surah = Number(sAr);
    let ayah = Number(aAr);
    let textAr = textArRaw.trim();

    if (!surahs[surah]) {
        surahs[surah] = {
            surah,
            hasBasmallah: false,
            basmallah: "",
            verses: []
        };
    }

    // --- Surah 1 (Fatiha) → count Basmallah as ayah 1 ---
    if (surah === 1 && ayah === 1 && BASMALLAH_REGEX.test(textAr)) {
        surahs[surah].hasBasmallah = true;
        surahs[surah].basmallah = textAr.match(BASMALLAH_REGEX)[0];
        // Keep Basmallah as verse 1 for Fatiha
        surahs[surah].verses.push({
            ayah: 1,
            arabic: surahs[surah].basmallah,
            english: "In the name of Allah, the Most Gracious, the Most Merciful.",
            hausa: "Da sunan Allah, Mai rahama, Mai jinƙai."
        });
        // Remove Basmallah from the original text if any extra text
        textAr = textAr.replace(BASMALLAH_REGEX, "").trim();
        if (textAr) {
            ayah = 2; // next verse number
        } else {
            continue; // no extra text in ayah 1
        }
    }

    // --- Surah 9 → never store Basmallah ---
    if (surah === 9 && BASMALLAH_REGEX.test(textAr)) {
        textAr = textAr.replace(BASMALLAH_REGEX, "").trim();
    }

    // --- Other Surahs (2–114) ---
    if (surah !== 1 && surah !== 9 && ayah === 1 && BASMALLAH_REGEX.test(textAr)) {
        surahs[surah].hasBasmallah = true;
        surahs[surah].basmallah = textAr.match(BASMALLAH_REGEX)[0];
        textAr = textAr.replace(BASMALLAH_REGEX, "").trim();
    }

    // Push actual ayah if there is text
    if (textAr) {
        surahs[surah].verses.push({
            ayah,
            arabic: textAr,
            english: textEn || "",
            hausa: textHa || ""
        });
    }
}

// OUTPUT
if (!fs.existsSync("./data/quran/surahs")) {
    fs.mkdirSync("./data/quran/surahs", { recursive: true });
}

for (let s = 1; s <= 114; s++) {
    if (!surahs[s]) {
        console.log(`Missing surah ${s}`);
        continue;
    }
    fs.writeFileSync(
        `./data/quran/surahs/surah_${s}.json`,
        JSON.stringify(surahs[s], null, 2),
        "utf8"
    );
}

console.log("✅ All Surah files created. Fatiha has Basmallah as first ayah; other surahs do not include Basmallah.");
