async function seedGrammar() {
  try {
    const filePath = path.join(__dirname, "../data/grammar.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const grammarList = JSON.parse(rawData);

    // Xoá dữ liệu cũ
    await runQuery("DELETE FROM grammar");

    for (const g of grammarList) {
      await runQuery(
        "INSERT INTO grammar (id, structure, meaning, example, translation) VALUES (?, ?, ?, ?, ?)",
        [g.id, g.structure, g.meaning, g.example, g.translation]
      );
    }

    console.log("✅ Seed grammar thành công!");
    process.exit();
  } catch (err) {
    console.error("❌ Lỗi seed:", err);
    process.exit(1);
  }
}
