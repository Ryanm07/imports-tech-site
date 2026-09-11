import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  chapterPhases,
  chooseMotionMode,
  motionPhases,
  pageProgress,
  sectionProgress,
  storyScrollPosition,
} from "../lib/motion";
import { STORY_VISUAL_PRESETS, storyMilestones } from "../lib/story";

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

test("fases narrativas são contínuas, limitadas e reversíveis", () => {
  const checkpoints = [0, 0.18, 0.38, 0.65, 0.86, 1];
  const forward = checkpoints.map(motionPhases);
  const backward = [...checkpoints].reverse().map(motionPhases).reverse();
  for (const phases of forward) {
    for (const value of Object.values(phases)) {
      assert.ok(value >= 0 && value <= 1);
    }
  }
  assert.deepEqual(backward, forward);
  const down = [1_000, 2_500, 4_000].map((scrollY) =>
    storyScrollPosition(scrollY, 1_000, 3_000, 13),
  );
  const up = [4_000, 2_500, 1_000]
    .map((scrollY) => storyScrollPosition(scrollY, 1_000, 3_000, 13))
    .reverse();
  assert.deepEqual(up, down);
  assert.deepEqual(chapterPhases(7.25, 7), chapterPhases(7.25, 7));
  assert.equal(chapterPhases(7, 7).focus, 1);
  assert.ok(chapterPhases(7.5, 7).focus > 0);
  assert.equal(chapterPhases(7, 7).signed, 0);
});

test("experiência mantém os componentes narrativos e fallback acessível", () => {
  const story = readFileSync("components/story-experience.tsx", "utf8");
  const scenes = readFileSync("components/story-micro-scene.tsx", "utf8");
  const projects = readFileSync("components/project-experience.tsx", "utf8");
  const provider = readFileSync(
    "components/motion/motion-provider.tsx",
    "utf8",
  );
  const background = readFileSync(
    "components/motion/interactive-background.tsx",
    "utf8",
  );
  const styles = readFileSync("public/styles/story.css", "utf8");
  assert.match(story, /aria-label="Navegar pelos capítulos"/);
  assert.match(story, /tabIndex=\{index === activeIndex \? 0 : -1\}/);
  assert.match(projects, /project-card-mobile-image/);
  assert.match(projects, /tabIndex=\{0\}/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /prefers-reduced-motion/);
  assert.match(story, /story-documentary-sticky/);
  assert.match(story, /chapterPhases/);
  assert.match(scenes, /case "mechanical-switch"/);
  assert.match(scenes, /case "heavy-processing"/);
  assert.match(background, /aria-hidden="true"/);
  assert.doesNotMatch(background, /<canvas|requestAnimationFrame/);
  assert.doesNotMatch(background, /getComputedStyle/);
  assert.match(styles, /html:not\(\.motion-ready\) \.story-documentary/);
});

test("trajetória publicada mantém treze capítulos únicos em primeira pessoa", () => {
  assert.equal(storyMilestones.length, 13);
  for (const milestone of storyMilestones) {
    assert.match(
      `${milestone.title} ${milestone.description}`,
      /\b(Eu|eu|Meu|Minha|meu|minha)\b/,
    );
  }
  assert.equal(storyMilestones.at(-1)?.number, "100 mil inscritos");
  const chapterPresets = storyMilestones.map((item) => item.visualType);
  assert.equal(new Set(chapterPresets).size, 13);
  assert.deepEqual(chapterPresets, [...STORY_VISUAL_PRESETS]);
  assert.ok(STORY_VISUAL_PRESETS.includes("time-balance"));
  assert.ok(STORY_VISUAL_PRESETS.includes("future-target"));
});
