import { execSync } from "child_process";

function main() {
  execSync("prisma migrate dev", { stdio: "inherit", cwd: "apps/backend" });
}

main();
