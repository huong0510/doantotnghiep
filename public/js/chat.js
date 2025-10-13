async function sendMessage(scenario, message) {
  const res = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, message })
  });
  const data = await res.json();
  if (data.success) return data.reply;
  throw new Error(data.error || "Lỗi server");
}

document.querySelector("#chatForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // 🔑 ngăn reload
  const input = document.querySelector("#messageInput");
  try {
    const reply = await sendMessage("greeting", input.value);
    console.log("AI trả lời:", reply);
    // Hiển thị ra giao diện
    document.querySelector("#chatBox").innerHTML += `<p><strong>Bạn:</strong> ${input.value}</p><p><strong>AI:</strong> ${reply}</p>`;
    input.value = "";
  } catch (err) {
    console.error(err);
  }
});
