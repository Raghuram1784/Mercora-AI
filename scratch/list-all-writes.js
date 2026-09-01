import fs from "fs";

const logPath = "C:\\Users\\Raghu Ram\\.gemini\\antigravity-ide\\brain\\1b9d8cc1-3b30-4238-a385-224ba1b304cb\\.system_generated\\logs\\transcript_full.jsonl";
const lines = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);

for (const line of lines) {
  try {
    const data = JSON.parse(line);
    const calls = data.tool_calls || [];
    for (const call of calls) {
      if (call.name === "replace_file_content" || call.name === "write_to_file") {
        const args = call.args || {};
        const tf = args.TargetFile || args.targetFile || "";
        if (tf.toLowerCase().includes("product-page.tsx")) {
          console.log(`Step ${data.step_index}: ${call.name}`);
        }
      }
    }
  } catch(e) {}
}
