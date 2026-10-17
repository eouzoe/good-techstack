// Architecture-gate self-test: proves dependency-cruiser still catches a
// synthetic layering violation. A parser or resolver regression can make the
// cruise report "no violations" while cruising zero modules (exactly what
// happened when the repo moved to TypeScript 7) — this oracle turns that
// silent false negative into a hard failure.
import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const probe = join(root, 'src/shared/__arch_selftest__.ts');
const expected = 'contracts-are-a-leaf';

// src/shared importing from src/server violates `contracts-are-a-leaf`.
writeFileSync(
  probe,
  "import { techs } from '../server/services/techs';\n\nexport const selftest = techs;\n",
);

try {
  const run = spawnSync(
    'node',
    ['node_modules/dependency-cruiser/bin/dependency-cruiser.mjs', 'src'],
    { cwd: root, encoding: 'utf8' },
  );
  const out = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;

  if (run.status === 0) {
    console.error(
      'arch-selftest: dependency-cruiser reported success for a synthetic violation — the gate is blind.',
    );
    process.exit(1);
  }
  if (!out.includes(expected)) {
    console.error(`arch-selftest: expected rule \`${expected}\` to fire, got:\n${out}`);
    process.exit(1);
  }
  console.log(`✔ arch-selftest: synthetic violation caught by \`${expected}\``);
} finally {
  rmSync(probe, { force: true });
}
