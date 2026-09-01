import fs from "fs";

// List of candidate Unsplash photo IDs for each category
const CANDIDATE_HEADPHONES = [
  "photo-1505740420928-5e560c06d30e",
  "photo-1577174881658-0f30ed549adc",
  "photo-1599669454699-248893623440",
  "photo-1546435770-a3e426bf472b",
  "photo-1583394838336-acd977736f90",
  "photo-1524678606370-a47ad25cb82a",
  "photo-1618366712010-f4ae9c647dcb",
  "photo-1484704849700-f032a568e944",
  "photo-1590658268037-6bf12165a8df",
  "photo-1545127398-14699f92334b",
];

const CANDIDATE_EARBUDS = [
  "photo-1590658268037-6bf12165a8df",
  "photo-1608156639585-b3a032ef9689",
  "photo-1627989580309-bfaf3e58af6f",
  "photo-1574269909862-7e1d70bb8078",
  "photo-1631857455684-a54a2f03665f",
  "photo-1585565804112-f201f68c48b4",
  "photo-1598331668826-20cecc5967f1",
  "photo-1644982695090-89e464c247f4",
  "photo-1560769629-975ec94e6a86",
];

const CANDIDATE_SMARTWATCHES = [
  "photo-1542496658-e33a6d0d50f6",
  "photo-1508685096489-7aacd43bd3b1",
  "photo-1523275335684-37898b6baf30",
  "photo-1579586337278-3befd40fd17a",
  "photo-1434494878577-86c23bcb06b9",
  "photo-1517502884422-41eaaced0168",
  "photo-1510017803434-a899398421b3",
  "photo-1522335789203-aabd1fc54bc9",
  "photo-1509042239860-f550ce710b93",
];

const CANDIDATE_SPEAKERS = [
  "photo-1608043152269-423dbba4e7e1",
  "photo-1589003077984-894e133dabab",
  "photo-1612196808214-b8e1d6145a8c",
  "photo-1545454675-3531b543be5d",
  "photo-1601944179066-297b8cd4e32a",
  "photo-1614149162883-504ce4d13909",
  "photo-1508700115892-45ecd05ae2ad",
  "photo-1511671782779-c97d3d27a1d4",
  "photo-1543512214-318c7553f230",
];

const CANDIDATE_POWERBANKS = [
  "photo-1574680096145-d05b474e2155",
  "photo-1588872657578-7efd1f1555ed",
  "photo-1511707171634-5f897ff02aa9",
  "photo-1565849904461-04a58ad377e0",
  "photo-1583863788434-e58a36330cf0",
  "photo-1585338111114-412b6b25f388",
  "photo-1584308666744-24d5c474f2ae",
  "photo-1619472381419-74d1a4c000bb",
  "photo-1544716278-ca5e3f4abd8c",
  "photo-1580910051074-3eb694886505",
];

const CANDIDATE_ACCESSORIES = [
  "photo-1616440347437-b1c73416efc2", // Desk mat
  "photo-1615663245857-ac93bb7c39e7", // Mouse
  "photo-1587829741301-dc798b83add3", // Keyboard
  "photo-1527443224154-c4a3942d3acf", // Stand
  "photo-1544716278-ca5e3f4abd8c", // Cable/Charger
  "photo-1611532736597-de2d4265fba3", // Wall charger
  "photo-1592832122594-c0c6bad74837", // USB Hub
  "photo-1589615369069-2f22b7a3cc20", // Cable
  "photo-1527864550417-7fd91fc51a46", // Mouse 2
  "photo-1618384887929-16ec33fab9ef", // Keyboard 2
];

async function checkPhoto(id: string): Promise<boolean> {
  const url = `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const testGroup = async (name: string, list: string[]) => {
    console.log(`--- Testing ${name} ---`);
    const valid = [];
    for (const id of list) {
      const ok = await checkPhoto(id);
      if (ok) valid.push(id);
      console.log(`${id}: ${ok ? "OK" : "INVALID"}`);
    }
    console.log(`Valid count for ${name}: ${valid.length}/${list.length}`);
    return valid;
  };

  await testGroup("Headphones", CANDIDATE_HEADPHONES);
  await testGroup("Earbuds", CANDIDATE_EARBUDS);
  await testGroup("Smartwatches", CANDIDATE_SMARTWATCHES);
  await testGroup("Speakers", CANDIDATE_SPEAKERS);
  await testGroup("Power Banks", CANDIDATE_POWERBANKS);
  await testGroup("Accessories", CANDIDATE_ACCESSORIES);
}

main().catch(console.error);
