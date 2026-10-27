/**
 * LinkPulse Repository Registry & Factory
 *
 * Provides single point of access for all data repositories.
 * By default, uses `LocalStorageRepository` for 100% frontend offline execution.
 * When `VITE_API_BASE_URL` is set, switches to `HttpApiRepository` for Node.js REST API.
 */

import { API_CONFIG } from '../config/api';
import {
  IAuthRepository,
  ILinkRepository,
  IAnalyticsRepository,
  ICampaignRepository,
  ITrustRepository,
  IBioRepository,
} from './contracts';
import {
  LocalAuthRepository,
  LocalLinkRepository,
  LocalAnalyticsRepository,
  LocalCampaignRepository,
  LocalTrustRepository,
  LocalBioRepository,
} from './LocalStorageRepository';
import {
  HttpAuthRepository,
  HttpLinkRepository,
  HttpAnalyticsRepository,
  HttpCampaignRepository,
  HttpTrustRepository,
  HttpBioRepository,
} from './HttpApiRepository';

const useHttpBackend = API_CONFIG.isBackendConnected;

export const authRepository: IAuthRepository = useHttpBackend
  ? new HttpAuthRepository()
  : new LocalAuthRepository();

export const linkRepository: ILinkRepository = useHttpBackend
  ? new HttpLinkRepository()
  : new LocalLinkRepository();

export const analyticsRepository: IAnalyticsRepository = useHttpBackend
  ? new HttpAnalyticsRepository()
  : new LocalAnalyticsRepository();

export const campaignRepository: ICampaignRepository = useHttpBackend
  ? new HttpCampaignRepository()
  : new LocalCampaignRepository();

export const trustRepository: ITrustRepository = useHttpBackend
  ? new HttpTrustRepository()
  : new LocalTrustRepository();

export const bioRepository: IBioRepository = useHttpBackend
  ? new HttpBioRepository()
  : new LocalBioRepository();

export * from './contracts';
export { LocalAuthRepository, LocalLinkRepository, LocalAnalyticsRepository } from './LocalStorageRepository';
export { HttpAuthRepository, HttpLinkRepository, HttpAnalyticsRepository } from './HttpApiRepository';
