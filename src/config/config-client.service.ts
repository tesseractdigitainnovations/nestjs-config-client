import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { remoteConfigSchema, localConfigSchema } from './config.validation';

@Injectable()
export class ConfigClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConfigClientService.name);
  private config: any = {};
  private intervalId: NodeJS.Timeout | null = null;

  private readonly serverUrl = process.env.CONFIG_SERVER_URL;
  private readonly appName = process.env.CONFIG_APP_NAME;
  private readonly profile = process.env.CONFIG_PROFILE;
  private readonly refreshInterval = parseInt(process.env.CONFIG_REFRESH_INTERVAL || '0', 10); // in ms, 0 means no refresh

  constructor(private readonly http: HttpService) {}

  async onModuleInit() {
    this.validateLocalConfig();
    await this.fetchConfig();
    this.startPeriodicRefresh();
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private startPeriodicRefresh() {
    if (this.refreshInterval > 0) {
      this.logger.log(`Starting periodic config refresh every ${this.refreshInterval} ms`);
      this.intervalId = setInterval(async () => {
        await this.fetchConfig();

        // log current config for debugging (avoid logging sensitive info in production)  // response example
        // {"statusCode":200,"timeStamp":"2025-10-01T23:56:58.852Z","success":true,"requestId":"6590ddb3-6290-4e08-94f1-7eaf3e80a55e","data":{"DATABASE_URL":"postgres://user:password@localhost:5432/mydb","JWT_SECRET":"your_jwt_secret_key"}
        this.logger.debug(`Current config: ${JSON.stringify(this.config)}`);
      }, this.refreshInterval);
    }
  }
  

  private validateLocalConfig() {
    const localConfig = {
      CONFIG_SERVER_URL: this.serverUrl,
      CONFIG_APP_NAME: this.appName,
      CONFIG_PROFILE: this.profile,
      CONFIG_REFRESH_INTERVAL: this.refreshInterval,
    };
    const { error } = localConfigSchema.validate(localConfig);
    if (error) {
      throw new Error(`Local config validation error: ${error.message}`);
    }
    this.logger.log('Local configuration validated successfully');
  }

  private validateRemoteConfig(config: any) {
    const { error, value } = remoteConfigSchema.validate(config, { allowUnknown: true });
    if (error) {
      throw new Error(`Remote config validation error: ${error.message}`);
    }
    return value;
  }

  async fetchConfig() {
    const url = `${this.serverUrl}/${this.appName}/${this.profile}`;
    try {
      this.logger.log(`Fetching config from ${url}...`);
      const response = await firstValueFrom(this.http.get(url));

      // ensure response server is up and response format is correct
      if (response.status !== 200) {
        throw new Error(`Failed to fetch configs: ${response.statusText}`);
      }

      // if response is wrapped in { statusCode, timeStamp, success, requestId, data }, extract data
      // Extract the actual config data from the wrapped response
      const configData = response.data?.data || response.data;
      this.config = this.validateRemoteConfig(configData);
      this.logger.log(`Config updated and validated`);
    } catch (err: any) {
      // Log the error with additional context like url and possible reasons
      console.error('Error fetching config:', err.message, `URL: ${url}`, "<-- possibly config server is down or unreachable");
      this.logger.error(`Failed to fetch/validate config: ${err.message}`);
    }
  }

  get(key: string, defaultValue: any = null): any {
    return this.config[key] ?? defaultValue;
  }
}
