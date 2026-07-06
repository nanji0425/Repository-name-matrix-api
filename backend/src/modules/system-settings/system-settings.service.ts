import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

export type SystemSettings = {
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  payments: {
    alipay: boolean;
  };
  general: {
    allowRegistration: boolean;
    requireInviteCode: boolean;
    maintenanceMode: boolean;
  };
  systemInfo: {
    version: string;
    environment: string;
    apiAddress: string;
  };
};

const DEFAULT_SETTINGS: SystemSettings = {
  rateLimit: {
    enabled: true,
    maxRequests: 120,
    windowMs: 60000,
  },
  payments: {
    alipay: true,
  },
  general: {
    allowRegistration: true,
    requireInviteCode: false,
    maintenanceMode: false,
  },
  systemInfo: {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiAddress: process.env.API_PUBLIC_URL || '/api',
  },
};

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private readonly settingsPath = resolve(process.env.SYSTEM_SETTINGS_FILE || 'data/system-settings.json');

  getSettings(): SystemSettings {
    const persisted = this.readPersistedSettings();
    return this.mergeSettings(DEFAULT_SETTINGS, persisted);
  }

  updateSettings(dto: UpdateSystemSettingsDto): SystemSettings {
    const current = this.getSettings();
    const next = this.mergeSettings(current, dto);
    this.writeSettings(next);
    return next;
  }

  private readPersistedSettings(): Partial<SystemSettings> {
    if (!existsSync(this.settingsPath)) return {};

    try {
      return JSON.parse(readFileSync(this.settingsPath, 'utf8'));
    } catch (error: any) {
      this.logger.warn(`Failed to read system settings: ${error?.message || error}`);
      return {};
    }
  }

  private writeSettings(settings: SystemSettings) {
    mkdirSync(dirname(this.settingsPath), { recursive: true });
    writeFileSync(this.settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  }

  private mergeSettings(base: SystemSettings, patch: Partial<SystemSettings> | UpdateSystemSettingsDto): SystemSettings {
    return {
      rateLimit: { ...base.rateLimit, ...(patch.rateLimit || {}) },
      payments: { ...base.payments, ...(patch.payments || {}) },
      general: { ...base.general, ...(patch.general || {}) },
      systemInfo: { ...base.systemInfo, ...((patch as Partial<SystemSettings>).systemInfo || {}) },
    };
  }
}
