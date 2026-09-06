import { GamingAPI } from '$lib/server/domains/gaming';

// Starting here rather than at import time of the domain keeps the poller out
// of anything that merely imports the gaming modules — migrations, tests, the
// drizzle CLI. Start() is idempotent and guarded across HMR reloads.
GamingAPI.poller.Start();
