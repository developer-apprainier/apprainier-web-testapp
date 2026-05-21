# AppRainier Web Test App

Static browser test app for the AppRainier Web SDK. It exercises surveys, announcements and banners, live cards, feature flags, experiments, audience variants, event logs, and message center.

## Setup

1. Place your downloaded admin-portal config at the app root:

```sh
cp /path/to/apprainier-config-stage-api-key.json apprainier-config.json
```

2. Start the static server:

```sh
npm run serve
```

3. Open:

```text
http://localhost:5174/apprainier-web-testapp/
```

## Config

The real config file is intentionally ignored by Git:

```text
apprainier-config.json
```

Use the committed template when setting up a new environment:

```text
apprainier-config.example.json
```

The test app initializes the SDK with:

```js
await AppRainier.initializeWithConfig(config);
```

## Development

The test app imports the SDK source directly from:

```text
../apprainier-web-plugin/src/index.js
```

Refresh the browser after SDK changes. If AppRainier calls fail in the browser, confirm the test origin is allowed in Appwrite Web/CORS settings:

```text
http://localhost:5174
```
