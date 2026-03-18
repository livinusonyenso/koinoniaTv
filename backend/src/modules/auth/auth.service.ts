import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(email: string, password: string, fullName?: string) {
    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, passwordHash, fullName });
    await this.userRepo.save(user);
    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Use social login');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await this.userRepo.save(user);
    return this.issueTokens(user);
  }

  /**
   * Verify a Google token and find-or-create the user.
   * Accepts either an id_token (when webClientId is configured)
   * or an access_token (Android-only flow).
   */
  async loginWithGoogle(token: string, tokenType: 'id_token' | 'access_token' = 'id_token') {
    let email: string;
    let fullName: string | undefined;

    try {
      if (tokenType === 'id_token') {
        const { data } = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
        );
        email    = data.email;
        fullName = data.name;
      } else {
        const { data } = await axios.get(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        email    = data.email;
        fullName = data.name;
      }
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!email) throw new UnauthorizedException('Google did not return an email');

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({ email, fullName });
      await this.userRepo.save(user);
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);
    return this.issueTokens(user);
  }

  async refreshTokens(userId: number) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.issueTokens(user);
  }

  async getProfile(userId: number): Promise<User> {
    return this.userRepo.findOneOrFail({ where: { id: userId } });
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, name: user.fullName } };
  }
}
