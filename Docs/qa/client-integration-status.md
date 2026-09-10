# Client integration status

## Verified

- Telegram credentials are absent from source and required at runtime.
- Web production server is bundled as native ESM and accepts `PORT`.
- Android debug builds use the standard Gradle debug signing flow; release signing is opt-in through CI environment variables.
- Android Gemini integration does not embed a usable API key in the APK.
- Python bot compiles successfully; JSON manifests parse successfully.

## Pending in this environment

- Web and doctor-panel `npm run build`/`npm run lint` could not run because `node_modules` is absent and dependency installation was unavailable in the sandbox.
- Android Gradle build could not run because the repository has no `gradlew` script or wrapper JAR and no system Gradle executable.
- The Android doctor repositories still seed Room mock data; wiring them to the Django API requires a deliberate repository migration.
- The existing Django routes are currently `/api/`, while the new client contract is `/api/v1/`; a compatibility alias or coordinated client/backend migration is still required before production deployment.
