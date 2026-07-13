import type { SeedProblem } from "./types";
import { easyProblems } from "./easy";
import { mediumProblemsPart1 } from "./medium-part1";
import { mediumProblemsPart2 } from "./medium-part2";
import { hardProblems } from "./hard";

export const problems: SeedProblem[] = [...easyProblems, ...mediumProblemsPart1, ...mediumProblemsPart2, ...hardProblems];
