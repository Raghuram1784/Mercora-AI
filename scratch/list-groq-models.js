import "dotenv/config";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not defined.");
    return;
  }

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log("Active Groq models:");
  console.log(data.data.map(m => m.id));
}

main().catch(console.error);
