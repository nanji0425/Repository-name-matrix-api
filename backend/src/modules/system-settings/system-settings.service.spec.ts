import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SystemSettingsService } from './system-settings.service';

async function run() {
  const dir = mkdtempSync(join(tmpdir(), 'matrix-settings-'));
  const previousPath = process.env.SYSTEM_SETTINGS_FILE;
  process.env.SYSTEM_SETTINGS_FILE = join(dir, 'settings.json');

  try {
    const service = new SystemSettingsService();
    const defaults = service.getSettings();
    assert.equal(defaults.rateLimit.enabled, true);
    assert.equal(defaults.payments.alipay, true);

    const updated = service.updateSettings({
      rateLimit: { enabled: false, maxRequests: 240 },
      general: { maintenanceMode: true },
    });
    assert.equal(updated.rateLimit.enabled, false);
    assert.equal(updated.rateLimit.maxRequests, 240);
    assert.equal(updated.rateLimit.windowMs, 60000);
    assert.equal(updated.general.maintenanceMode, true);

    const reloaded = new SystemSettingsService().getSettings();
    assert.equal(reloaded.rateLimit.enabled, false);
    assert.equal(reloaded.rateLimit.maxRequests, 240);
    assert.equal(reloaded.general.maintenanceMode, true);
  } finally {
    if (previousPath === undefined) delete process.env.SYSTEM_SETTINGS_FILE;
    else process.env.SYSTEM_SETTINGS_FILE = previousPath;
    rmSync(dir, { recursive: true, force: true });
  }

  console.log('system settings service tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
