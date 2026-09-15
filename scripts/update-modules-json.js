const fs = require("fs");
const path = require("path");
const https = require("https");

const OWNER = "Zouzow";
const REPO = "modules-store";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function isLower(str) {
  return str === str.toLowerCase() && str !== str.toUpperCase();
}

async function main() {
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases`;
  const releases = await fetchJson(apiUrl);

  const modulesMap = {};

  for (const rel of releases) {
    // convention: tag_name = "<moduleName>-vX.Y.Z"
    const [name, versionTag] = rel.tag_name.split("-v");
    const version = versionTag;

    let title = "";
    title += name.charAt(0).toUpperCase();
    for (const char of name.slice(1)) {
      if (!isLower(char)) title += " ";
      title += char;
    }

    const asset = rel.assets.find((a) => a.name.endsWith(".zip"));
    if (!asset) continue;

    const downloadURL = asset.browser_download_url;

    if (!modulesMap[name]) {
      modulesMap[name] = {
        title,
        name,
        description: "",
        iconName: "",
        color: "",
        latestVersion: version,
        downloadURL,
      };
    } else {
      if (modulesMap[name].latestVersion < version) {
        modulesMap[name].latestVersion = version;
        modulesMap[name].downloadUrl = downloadUrl;
      }
    }
  }

  const modules = Object.values(modulesMap);
  const filePath = path.join(__dirname, "..", "modules.json");
  fs.writeFileSync(filePath, JSON.stringify(modules, null, 2), "utf-8");
  console.log("modules.json mis à jour.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
