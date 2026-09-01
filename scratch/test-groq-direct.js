import "dotenv/config";
import Groq from "groq-sdk";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama3-8b-8192";

  console.log("Using API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "none");
  console.log("Using Model:", model);

  if (!apiKey) {
    console.error("GROQ_API_KEY is not defined.");
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello!" }],
      model: model,
    });
    console.log("Success! Completion output:", chatCompletion.choices[0].message.content);
  } catch (err) {
    console.error("Groq Direct API Call failed:");
    console.error(err);
  }
}

main().catch(console.error);
