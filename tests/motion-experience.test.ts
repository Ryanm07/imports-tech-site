import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chooseMotionMode, pageProgress, sectionProgress } from "../lib/motion";
import { storyMilestones } from "../lib/story";

test("progresso global e local permanece limitado entre zero e um", () => {
  assert.equal(pageProgress(0, 2_000, 1_000), 0);
  assert.equal(pageProgress(500, 2_000, 1_000), 0.5);
  assert.equal(pageProgress(9_000, 2_000, 1_000), 1);
  assert.equal(sectionProgress(1_000, 800, 800), 0);
  assert.equal(sectionProgress(0, 800, 800), 0.5);
  assert.equal(sectionProgress(-800, 800, 800), 1);
});

test("modo de movimento respeita redução, economia de dados e capacidade", () => {
  assert.equal(chooseMotionMode({ reducedMotion: true }), "reduced");
  assert.equal(
    chooseMotionMode({ reducedMotion: false, saveData: true }),
    "light",
  );
  assert.equal(
    chooseMotionMode({
      reducedMotion: false,
      hardwareConcurrency: 12,
      deviceMemory: 8,
      viewportWidth: 1440,
    }),
    "full",
  );
});

test("experiência mantém os componentes narrativos e fallback acessível", () => {
  const story = readFileSync("components/story-experience.tsx", "utf8");
  const projects = readFileSync("components/project-experience.tsx", "utf8");
  const provider = readFileSync(
    "components/motion/motion-provider.tsx",
    "utf8",
  );
  assert.match(story, /aria-label="Navegar pelos capítulos"/);
  assert.match(story, /tabIndex=\{0\}/);
  assert.match(projects, /project-card-mobile-image/);
  assert.match(projects, /tabIndex=\{0\}/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /prefers-reduced-motion/);
});

test("trajetória publicada continua com os doze fatos confirmados em primeira pessoa", () => {
  assert.equal(storyMilestones.length, 12);
  for (const milestone of storyMilestones) {
    assert.match(
      `${milestone.title} ${milestone.description}`,
      /\b(Eu|eu|Meu|Minha|meu|minha)\b/,
    );
  }
  assert.equal(storyMilestones.at(-1)?.number, "100 mil inscritos");
});
