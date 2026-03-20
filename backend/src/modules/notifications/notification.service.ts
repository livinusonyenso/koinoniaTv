import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { DeviceToken } from './device-token.entity';
import { getMessaging } from './firebase.config';

const BATCH_SIZE = 500; // FCM multicast limit

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly tokenRepo: Repository<DeviceToken>,
  ) {}

  // ── Token management ──────────────────────────────────────────

  async registerToken(userId: number, token: string, platform = 'android'): Promise<void> {
    await this.tokenRepo.upsert(
      { userId, token, platform },
      { conflictPaths: ['userId', 'token'], skipUpdateIfNoValuesChanged: true },
    );
  }

  async removeToken(token: string): Promise<void> {
    await this.tokenRepo.delete({ token });
  }

  // ── Send helpers ──────────────────────────────────────────────

  /**
   * Fire-and-forget send to a single FCM token.
   * Auto-deletes the token if FCM reports it as invalid.
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const messaging = getMessaging();
    if (!messaging) return;

    try {
      await messaging.send({
        token,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
      });
    } catch (err: any) {
      const invalid = ['registration-token-not-registered', 'invalid-registration-token'];
      if (invalid.some(c => err?.code?.includes(c))) {
        await this.removeToken(token).catch(() => {});
      }
    }
  }

  /** Send to all tokens belonging to a user. */
  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.tokenRepo.find({ where: { userId } });
    await Promise.allSettled(tokens.map(t => this.sendToDevice(t.token, title, body, data)));
  }

  /**
   * Broadcast to all registered devices.
   * Batches in groups of 500 (FCM multicast limit).
   */
  async sendToAll(
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const messaging = getMessaging();
    if (!messaging) return;

    // Only send to users who have notifications enabled
    const rows = await this.tokenRepo
      .createQueryBuilder('dt')
      .select('dt.token', 'token')
      .where('dt.userId IN (SELECT id FROM users WHERE notifications_enabled = 1)')
      .getRawMany<{ token: string }>();
    const tokenStrings = rows.map(r => r.token);

    for (let i = 0; i < tokenStrings.length; i += BATCH_SIZE) {
      const batch = tokenStrings.slice(i, i + BATCH_SIZE);
      try {
        const result = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: data ?? {},
          android: { priority: 'high' },
        });

        // Auto-delete invalid tokens returned in the batch response
        const invalidTokens: string[] = [];
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code ?? '';
            if (code.includes('not-registered') || code.includes('invalid-registration-token')) {
              invalidTokens.push(batch[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await Promise.allSettled(invalidTokens.map(t => this.removeToken(t)));
          this.logger.log(`Removed ${invalidTokens.length} invalid token(s)`);
        }
      } catch (err: any) {
        this.logger.error(`Batch send failed: ${err.message}`);
      }
    }

    this.logger.log(`Broadcast sent to ${tokenStrings.length} device(s): "${title}"`);
  }

  // ── Daily Word cron ───────────────────────────────────────────

  /** Every day at 7:00 AM */
  @Cron('0 0 7 * * *')
  async sendDailyWord(): Promise<void> {
    const verses = [
      { title: '📖 Daily Word', body: '"For I know the plans I have for you," declares the Lord. — Jer 29:11' },
      { title: '📖 Daily Word', body: '"I can do all things through Christ who strengthens me." — Phil 4:13' },
      { title: '📖 Daily Word', body: '"The Lord is my shepherd; I shall not want." — Ps 23:1' },
      { title: '📖 Daily Word', body: '"Trust in the Lord with all your heart." — Prov 3:5' },
      { title: '📖 Daily Word', body: '"Be strong and courageous. Do not be afraid." — Josh 1:9' },
      { title: '📖 Daily Word', body: '"Cast all your anxiety on Him because He cares for you." — 1 Pet 5:7' },
      { title: '📖 Daily Word', body: '"And we know that in all things God works for the good." — Rom 8:28' },
    ];

    const today = new Date().getDay(); // 0–6
    const { title, body } = verses[today];

    this.logger.log(`Sending daily word: ${body.slice(0, 50)}...`);
    // Fire-and-forget — never throw
    this.sendToAll(title, body, { type: 'daily_word' }).catch(() => {});
  }
}
