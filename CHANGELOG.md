# Changelog

## [0.4.0](https://github.com/black-atom-industries/shiplog/compare/v0.3.0...v0.4.0) (2026-04-21)


### ⚠ BREAKING CHANGES

* add OpenRouter provider support
* update all documentation for shiplog rename
* update project config for shiplog rename
* rename brick to shiplog in source and tests
* **config:** migrate from YAML to TOML with snake_case keys

### build

* update project config for shiplog rename ([cc08a2d](https://github.com/black-atom-industries/shiplog/commit/cc08a2db5f23577d8f8d392bf45ded72439452ce))


### Features

* add adapter map replacing providers/ abstraction ([afe796e](https://github.com/black-atom-industries/shiplog/commit/afe796e80221f2d1ccf7e8049e7ea5cead7e9e6f))
* add brick config command (--init, --schema, --show) ([7441276](https://github.com/black-atom-industries/shiplog/commit/74412765fd714f1789fa39a307919b59fa5cfaf8))
* add brick init command for repo-local config ([1f4ba24](https://github.com/black-atom-industries/shiplog/commit/1f4ba247ddb0c2b7e827e994a9d2ebe13ed33bdd))
* add global install task, README, and default help output ([653d77d](https://github.com/black-atom-industries/shiplog/commit/653d77dc74d4f769c8229d7e43c747faaa2240f1))
* add JSON Schema generation from zod config schema ([1cbd81f](https://github.com/black-atom-industries/shiplog/commit/1cbd81ff451245e0e3e78eb81b1ad663b33a7f16))
* add OpenRouter provider support ([cd492ac](https://github.com/black-atom-industries/shiplog/commit/cd492acdd0530ea403428690d58d5cca0def68af))
* **commit:** wire guided builder as default commit flow ([f263fac](https://github.com/black-atom-industries/shiplog/commit/f263fac77294dbf4c8ad4df03b285ac90179e0b5))
* **config:** add useLazygit and commitTypes to RepoConfigSchema ([405fab1](https://github.com/black-atom-industries/shiplog/commit/405fab1397909e223244acc97bb4c3b4fa0e0187))
* **config:** migrate from YAML to TOML with snake_case keys ([7a41ced](https://github.com/black-atom-industries/shiplog/commit/7a41ced8fb2f097e7eaaef428112c595fd37065e))
* offer lazygit for staging when no changes are staged in smart mode ([791fd3a](https://github.com/black-atom-industries/shiplog/commit/791fd3a39374a3d682d4e787447ee1c38d26ef7d))
* register config/init commands, move git guard to individual commands ([22d5b2d](https://github.com/black-atom-industries/shiplog/commit/22d5b2da38a45e2a5d7c2a7c184dd4617cb73a39))
* **ui:** add buildCommitMessage pure function with tests ([78283e0](https://github.com/black-atom-industries/shiplog/commit/78283e08e09428b9b22fe66d4b799559a0e636de))
* **ui:** add configurable scope selector with custom override ([09af263](https://github.com/black-atom-industries/shiplog/commit/09af263df8ad4a011ffae638341cca18954277af))
* **ui:** add runGuidedCommit interactive flow ([420f6d5](https://github.com/black-atom-industries/shiplog/commit/420f6d55d922a876d15c0392da88fcd3e74862b5))
* **ui:** enable search/filter on commit type selector ([3871dfb](https://github.com/black-atom-industries/shiplog/commit/3871dfbd23386e1ca715a5f8830b016c19d23c25))
* use remote schema URL and commit schema.json ([7190223](https://github.com/black-atom-industries/shiplog/commit/719022304d616e980018da6838f282e92872643a))


### Bug Fixes

* **ai:** sanitize leading punctuation from LLM output ([6e6119a](https://github.com/black-atom-industries/shiplog/commit/6e6119aa10fe229e2d94ddc0a31a0596e3d89043))
* **cli:** read version from deno.json ([f90cdb9](https://github.com/black-atom-industries/shiplog/commit/f90cdb945daccc07357ab1300581d54640e5b0da))
* correct chat() usage with AG-UI streaming protocol ([cade87f](https://github.com/black-atom-industries/shiplog/commit/cade87f1ea43333fe255c5c91ddd77df1e3a1885))
* improve error handling in config commands and adapter map ([f07cc08](https://github.com/black-atom-industries/shiplog/commit/f07cc08434654f166b7e5074c8f8d208f53eec33))
* make config paths reactive to HOME env changes ([b836508](https://github.com/black-atom-industries/shiplog/commit/b836508a7139ca66d5a92dbee92f4c8f878f530b))
* **openrouter:** replace retired model defaults ([898755f](https://github.com/black-atom-industries/shiplog/commit/898755fa36cceee6400627e391dc9d6300907673))
* replace deprecated .merge() with shape spread in config schema ([0adb14e](https://github.com/black-atom-industries/shiplog/commit/0adb14ec649773e935b5bd5547a174495f6495fd))
* **ui:** handle Ctrl+C gracefully in guided commit flow ([0b68615](https://github.com/black-atom-industries/shiplog/commit/0b686150cc5c28deeb088b16e2016321b099ce98))
* **ui:** re-prompt on empty subject instead of exiting ([171c5b2](https://github.com/black-atom-industries/shiplog/commit/171c5b2e7bffd264e8895116ee079c13834d3013))


### Documentation

* add commit builder implementation plan ([3841560](https://github.com/black-atom-industries/shiplog/commit/38415603a5e40e8833064d05dc0f2846a78f2b0f))
* add config restructure design spec ([ffd8fd2](https://github.com/black-atom-industries/shiplog/commit/ffd8fd27b5f2cc29e70051a4bd71413e5daeedd9))
* add config restructure implementation plan ([4c39bd2](https://github.com/black-atom-industries/shiplog/commit/4c39bd2a08d678ee964a3590fd331ae1b6855c4b))
* add LLM support section to README ([25775d7](https://github.com/black-atom-industries/shiplog/commit/25775d7adf9fc5cf59ba55cf3735395a43680273))
* add project README ([ce9c800](https://github.com/black-atom-industries/shiplog/commit/ce9c800e8f591a761a0da9f28ed3844290bd2ba5))
* **readme:** add initial draft ([81b210c](https://github.com/black-atom-industries/shiplog/commit/81b210c195f4357aaf60f09cc532128a2e7bfbd3))
* remove implementation plan docs from superpowers/ ([d7ab9c2](https://github.com/black-atom-industries/shiplog/commit/d7ab9c2a6f74f27605ec24041938da78602c6ed1))
* update all documentation for shiplog rename ([0cf4417](https://github.com/black-atom-industries/shiplog/commit/0cf441735b07e26e9bbb7937e5b644cc3c8097d7))
* update example issue prefix in branch naming prompt ([481314b](https://github.com/black-atom-industries/shiplog/commit/481314b8388f5bf3bb40794ac10f49d7afaf3909))
* update README and init template for commit builder ([9d79499](https://github.com/black-atom-industries/shiplog/commit/9d79499d12e620b9146c63f8b3f4f591bac4d6d8))
* update README title and tagline ([0b0769c](https://github.com/black-atom-industries/shiplog/commit/0b0769c79d67fcd885f2b73ba8df0d9b5fc020e6))
* update README with commitTypes and useLazygit config examples ([4f79544](https://github.com/black-atom-industries/shiplog/commit/4f79544aaf05de231eeac118ed2c9d8036c5e696))


### Refactors

* extract lazygit utilities to dedicated module ([b9b9793](https://github.com/black-atom-industries/shiplog/commit/b9b9793bc8068c109af5408d0622674686d8cc25))
* preserve type safety through adapter and config chain ([5329130](https://github.com/black-atom-industries/shiplog/commit/53291301f1f3f92f8dc21e11bcfff420184bf8d0))
* remove providers/ abstraction and defaults.ts ([6eea01c](https://github.com/black-atom-industries/shiplog/commit/6eea01c83624c3a4288f5245eba360fe0144c3db))
* remove unused branch param from buildCommitPrompt ([9138c5a](https://github.com/black-atom-industries/shiplog/commit/9138c5a418100bd3a3d60191f6bb16a63a2989ef))
* rename brick to shiplog in source and tests ([964b4e8](https://github.com/black-atom-industries/shiplog/commit/964b4e818a33496fa0d96e7f5bb670633b074ded))
* rewrite config schema with inline defaults from adapter map ([c6e0cd9](https://github.com/black-atom-industries/shiplog/commit/c6e0cd99e43adb051010ebc7d762081e980d99ff))
* split prompts into separate modules and simplify post-write hooks ([066f3ab](https://github.com/black-atom-industries/shiplog/commit/066f3aba82bb2d00e624c84bfd5221233d7165be))
* **ui:** extract openInEditor from editMessage ([29339d2](https://github.com/black-atom-industries/shiplog/commit/29339d2bcfda17d53d23bf70d3193eda25fcdedc))

## [0.3.0](https://github.com/black-atom-industries/shiplog/compare/v0.2.0...v0.3.0) (2026-03-18)


### ⚠ BREAKING CHANGES

* update all documentation for shiplog rename
* update project config for shiplog rename
* rename brick to shiplog in source and tests
* **config:** migrate from YAML to TOML with snake_case keys

### build

* update project config for shiplog rename ([cc08a2d](https://github.com/black-atom-industries/shiplog/commit/cc08a2db5f23577d8f8d392bf45ded72439452ce))


### Features

* **config:** migrate from YAML to TOML with snake_case keys ([7a41ced](https://github.com/black-atom-industries/shiplog/commit/7a41ced8fb2f097e7eaaef428112c595fd37065e))
* **ui:** add configurable scope selector with custom override ([09af263](https://github.com/black-atom-industries/shiplog/commit/09af263df8ad4a011ffae638341cca18954277af))


### Documentation

* update all documentation for shiplog rename ([0cf4417](https://github.com/black-atom-industries/shiplog/commit/0cf441735b07e26e9bbb7937e5b644cc3c8097d7))


### Refactors

* rename brick to shiplog in source and tests ([964b4e8](https://github.com/black-atom-industries/shiplog/commit/964b4e818a33496fa0d96e7f5bb670633b074ded))

## [0.2.0](https://github.com/black-atom-industries/shiplog/compare/v0.1.0...v0.2.0) (2026-03-13)


### Features

* **commit:** wire guided builder as default commit flow ([f263fac](https://github.com/nikbrunner/brick/commit/f263fac77294dbf4c8ad4df03b285ac90179e0b5))
* **config:** add useLazygit and commitTypes to RepoConfigSchema ([405fab1](https://github.com/nikbrunner/brick/commit/405fab1397909e223244acc97bb4c3b4fa0e0187))
* **ui:** add buildCommitMessage pure function with tests ([78283e0](https://github.com/nikbrunner/brick/commit/78283e08e09428b9b22fe66d4b799559a0e636de))
* **ui:** add runGuidedCommit interactive flow ([420f6d5](https://github.com/nikbrunner/brick/commit/420f6d55d922a876d15c0392da88fcd3e74862b5))
* **ui:** enable search/filter on commit type selector ([3871dfb](https://github.com/nikbrunner/brick/commit/3871dfbd23386e1ca715a5f8830b016c19d23c25))


### Bug Fixes

* **ui:** handle Ctrl+C gracefully in guided commit flow ([0b68615](https://github.com/nikbrunner/brick/commit/0b686150cc5c28deeb088b16e2016321b099ce98))
* **ui:** re-prompt on empty subject instead of exiting ([171c5b2](https://github.com/nikbrunner/brick/commit/171c5b2e7bffd264e8895116ee079c13834d3013))


### Documentation

* add commit builder implementation plan ([3841560](https://github.com/nikbrunner/brick/commit/38415603a5e40e8833064d05dc0f2846a78f2b0f))
* add LLM support section to README ([25775d7](https://github.com/nikbrunner/brick/commit/25775d7adf9fc5cf59ba55cf3735395a43680273))
* update README and init template for commit builder ([9d79499](https://github.com/nikbrunner/brick/commit/9d79499d12e620b9146c63f8b3f4f591bac4d6d8))
* update README title and tagline ([0b0769c](https://github.com/nikbrunner/brick/commit/0b0769c79d67fcd885f2b73ba8df0d9b5fc020e6))


### Refactors

* **ui:** extract openInEditor from editMessage ([29339d2](https://github.com/nikbrunner/brick/commit/29339d2bcfda17d53d23bf70d3193eda25fcdedc))
