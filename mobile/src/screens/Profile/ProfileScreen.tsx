import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { userApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const { width: W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:          '#0D0A1A',
  card:        '#16112A',
  cardBorder:  '#2D1B55',
  purple:      '#4B2E83',
  purpleGlow:  '#6B46C1',
  gold:        '#F4C430',
  goldDim:     '#C49A10',
  goldPale:    '#FDF0C044',
  text:        '#F5F0FF',
  textSub:     '#A89EC9',
  textMute:    '#5E5380',
  red:         '#EF4444',
  redDim:      '#3A1515',
  surface:     '#0F0C1E',
};

// ── Helpers ───────────────────────────────────────────────────
function getInitials(fullName?: string, name?: string, email?: string): string {
  const src = fullName ?? name ?? email ?? '';
  const parts = src.split(/[\s@]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase() || '??';
}

function formatWatchTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(totalSeconds / 60);
  return `${mins}m`;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({
  icon, value, label, accent = false,
}: {
  icon: string; value?: number | string; label: string; accent?: boolean;
}) {
  return (
    <View style={[s.statCard, accent && s.statCardAccent]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={accent ? T.bg : T.gold}
        style={{ marginBottom: 6 }}
      />
      <Text style={[s.statValue, accent && { color: T.bg }]}>
        {value ?? '—'}
      </Text>
      <Text style={[s.statLabel, accent && { color: T.bg + 'CC' }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Menu Row ──────────────────────────────────────────────────
function MenuRow({
  icon, label, sub, value, onPress, danger = false, showChevron = true,
}: {
  icon: string;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={s.menuRow}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={!onPress}
    >
      <View style={[s.menuIcon, danger && s.menuIconDanger]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={19}
          color={danger ? T.red : T.gold}
        />
      </View>
      <View style={s.menuBody}>
        <Text style={[s.menuLabel, danger && { color: T.red }]}>{label}</Text>
        {!!sub && <Text style={s.menuSub}>{sub}</Text>}
      </View>
      {value !== undefined && (
        <Text style={s.menuValue}>{value}</Text>
      )}
      {showChevron && onPress && !value && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={T.textMute} />
      )}
    </TouchableOpacity>
  );
}

function MenuDivider() {
  return <View style={s.menuDivider} />;
}

// ── Section ───────────────────────────────────────────────────
function Section({ children }: { children: React.ReactNode }) {
  return <View style={s.section}>{children}</View>;
}

function SectionLabel({ title }: { title: string }) {
  return (
    <View style={s.sectionLabelRow}>
      <Text style={s.sectionLabel}>{title}</Text>
      <View style={s.sectionLabelLine} />
    </View>
  );
}

// ── Guest View ────────────────────────────────────────────────
function GuestView({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.guestWrap}>
        {/* decorative cross */}
        <View style={s.guestCross}>
          <View style={s.crossV} />
          <View style={s.crossH} />
        </View>

        <LinearGradient
          colors={[T.purple + '44', 'transparent']}
          style={s.guestGlow}
        />

        <View style={s.guestAvatarRing}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={64}
            color={T.textMute}
          />
        </View>

        <Text style={s.guestTitle}>Join Koinonia TV</Text>
        <Text style={s.guestSub}>
          Sign in to save sermons, track your watch progress, create playlists and submit prayer requests
        </Text>

        <TouchableOpacity
          style={s.guestPrimary}
          onPress={() => navigation.navigate('AuthModal')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="login" size={18} color={T.bg} />
          <Text style={s.guestPrimaryText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.guestSecondary}
          onPress={() => navigation.navigate('AuthModal')}
          activeOpacity={0.75}
        >
          <Text style={s.guestSecondaryText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={s.guestFooter}>
          Browse sermons freely — sign in only when you need to save or submit
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { user, authState, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: bkmData } = useQuery({
    queryKey: ['bookmarks', { page: 1, limit: 1 }],
    queryFn: () => userApi.getBookmarks({ page: 1, limit: 1 }),
    enabled: authState === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });

  const { data: histData } = useQuery({
    queryKey: ['history', { page: 1, limit: 1 }],
    queryFn: () => userApi.getHistory({ page: 1, limit: 1 }),
    enabled: authState === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => userApi.getNotificationPrefs(),
    enabled: authState === 'authenticated',
  });

  const notifMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      userApi.updateNotificationPrefs({ notificationsEnabled: enabled }),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-prefs'], data);
    },
  });

  if (authState !== 'authenticated') {
    return <GuestView navigation={navigation} />;
  }

  const displayName = user?.fullName ?? user?.name ?? 'Believer';
  const initials = getInitials(user?.fullName, user?.name, user?.email);
  const isAdmin = user?.isAdmin === true;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ══════════════════════════════════════
            HERO HEADER
        ══════════════════════════════════════ */}
        <View style={s.hero}>
          {/* Background gradient mesh */}
          <LinearGradient
            colors={[T.purple + 'BB', T.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Decorative circles */}
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          {/* Top bar */}
          <View style={s.heroTopBar}>
            <Text style={s.heroTopBarTitle}>My Profile</Text>
            {isAdmin && (
              <View style={s.adminBadge}>
                <MaterialCommunityIcons
                  name="shield-crown-outline"
                  size={11}
                  color={T.gold}
                />
                <Text style={s.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            {/* Outer glow ring */}
            <View style={s.avatarGlowRing} />
            {/* Gold border ring */}
            <View style={s.avatarBorderRing}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            </View>

            {/* Gold sparkle dot */}
            <View style={s.avatarDot}>
              <View style={s.avatarDotInner} />
            </View>
          </View>

          {/* Name + email */}
          <Text style={s.heroName}>{displayName}</Text>
          <Text style={s.heroEmail}>{user?.email}</Text>

          {/* Verse tagline */}
          <Text style={s.heroVerse}>✦  Growing in Faith Daily  ✦</Text>
        </View>

        {/* ══════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════ */}
        <View style={s.statsRow}>
          <StatCard
            icon="bookmark-multiple-outline"
            value={bkmData?.total ?? 0}
            label="Saved"
          />
          <View style={s.statsSep} />
          <StatCard
            icon="play-circle-outline"
            value={histData?.total ?? 0}
            label="Watched"
            accent
          />
          <View style={s.statsSep} />
          <StatCard
            icon="playlist-play"
            value={0}
            label="Playlists"
          />
        </View>

        {/* ══════════════════════════════════════
            MY LIBRARY
        ══════════════════════════════════════ */}
        <SectionLabel title="MY LIBRARY" />
        <Section>
          <MenuRow
            icon="bookmark-multiple-outline"
            label="Saved Sermons"
            sub={bkmData?.total ? `${bkmData.total} bookmarked` : 'No bookmarks yet'}
            onPress={() => navigation.navigate('Bookmarks')}
          />
          <MenuDivider />
          <MenuRow
            icon="history"
            label="Watch History"
            sub={histData?.total ? `${histData.total} sermons watched` : 'Start watching to track progress'}
            onPress={() => navigation.navigate('History')}
          />
          <MenuDivider />
          <MenuRow
            icon="playlist-music-outline"
            label="My Playlists"
            sub="Create playlists for morning devotion"
            onPress={() => navigation.navigate('Playlists')}
          />
        </Section>

        {/* ══════════════════════════════════════
            SPIRITUAL TOOLS
        ══════════════════════════════════════ */}
        <SectionLabel title="SPIRITUAL" />
        <Section>
          <MenuRow
            icon="hands-pray"
            label="Prayer Requests"
            sub="View your submitted requests"
            onPress={() => navigation.navigate('PrayerRequest')}
          />
          <MenuDivider />
          <MenuRow
            icon="notebook-outline"
            label="Sermon Notes"
            sub="Notes you've taken while watching"
            onPress={() => navigation.navigate('MyNotes')}
          />
        </Section>

        {/* ══════════════════════════════════════
            SETTINGS
        ══════════════════════════════════════ */}
        <SectionLabel title="SETTINGS" />
        <Section>
          {/* Notifications toggle */}
          <View style={s.menuRow}>
            <View style={s.menuIcon}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={19}
                color={T.gold}
              />
            </View>
            <View style={s.menuBody}>
              <Text style={s.menuLabel}>Push Notifications</Text>
              <Text style={s.menuSub}>
                {prefs?.notificationsEnabled
                  ? 'Receiving sermons, live & daily word'
                  : 'Notifications are off'}
              </Text>
            </View>
            {prefsLoading ? (
              <ActivityIndicator size="small" color={T.gold} />
            ) : (
              <Switch
                value={prefs?.notificationsEnabled ?? true}
                onValueChange={(v) => notifMutation.mutate(v)}
                disabled={notifMutation.isPending}
                trackColor={{ false: T.cardBorder, true: T.purple }}
                thumbColor={T.gold}
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            )}
          </View>

          <MenuDivider />

          <MenuRow
            icon="star-outline"
            label="Rate Koinonia TV"
            sub="Share your experience on Play Store"
            onPress={() => {}}
          />

          <MenuDivider />

          <MenuRow
            icon="share-variant-outline"
            label="Share App"
            sub="Invite others to grow in faith"
            onPress={() => {}}
          />
        </Section>

        {/* ══════════════════════════════════════
            ACCOUNT
        ══════════════════════════════════════ */}
        <SectionLabel title="ACCOUNT" />
        <Section>
          <MenuRow
            icon="logout"
            label="Sign Out"
            sub="You can sign back in anytime"
            onPress={handleLogout}
            danger
          />
        </Section>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerCross}>
            <View style={s.footerCrossV} />
            <View style={s.footerCrossH} />
          </View>
          <Text style={s.footerText}>Koinonia TV</Text>
          <Text style={s.footerVersion}>v1.0.0 · Built with faith</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 260,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: T.gold + '08',
    top: -60, right: -40,
    borderWidth: 1,
    borderColor: T.gold + '15',
  },
  heroCircle2: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: T.purpleGlow + '15',
    bottom: 20, left: -30,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  heroTopBarTitle: {
    color: T.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.gold + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: T.gold + '44',
  },
  adminBadgeText: {
    color: T.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Avatar
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 108, height: 108,
    borderRadius: 54,
    backgroundColor: T.gold + '18',
    top: -6,
  },
  avatarBorderRing: {
    width: 96, height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: T.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    backgroundColor: T.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: T.gold,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  avatarDot: {
    position: 'absolute',
    bottom: 2, right: W / 2 - 50,
    width: 16, height: 16,
    borderRadius: 8,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDotInner: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E', // online green
  },

  heroName: {
    color: T.text,
    fontSize: FontSize.xl + 2,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroEmail: {
    color: T.textSub,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroVerse: {
    color: T.gold + 'AA',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1.5,
    fontWeight: '600',
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: -14,
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: T.cardBorder,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statCardAccent: {
    backgroundColor: T.gold,
  },
  statValue: {
    color: T.text,
    fontSize: FontSize.xl,
    fontWeight: '900',
    lineHeight: 22,
  },
  statLabel: {
    color: T.textMute,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsSep: {
    width: 1,
    backgroundColor: T.cardBorder,
    marginVertical: 10,
  },

  // ── Section label ──
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: 8,
    marginTop: 16,
    gap: 8,
  },
  sectionLabel: {
    color: T.textMute,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.cardBorder,
  },

  // ── Section card ──
  section: {
    marginHorizontal: Spacing.md,
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: T.cardBorder,
    overflow: 'hidden',
  },

  // ── Menu rows ──
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: T.gold + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: T.red + '18',
  },
  menuBody: {
    flex: 1,
  },
  menuLabel: {
    color: T.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  menuSub: {
    color: T.textMute,
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  menuValue: {
    color: T.textSub,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: T.cardBorder,
    marginLeft: 14 + 36 + 12,
  },

  // ── Guest ──
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  guestCross: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.06,
  },
  crossV: {
    position: 'absolute',
    width: 3, height: 60,
    backgroundColor: T.gold,
    borderRadius: 2,
  },
  crossH: {
    position: 'absolute',
    width: 44, height: 3,
    backgroundColor: T.gold,
    top: 14,
    borderRadius: 2,
  },
  guestGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
  },
  guestAvatarRing: {
    width: 110, height: 110,
    borderRadius: 55,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    color: T.text,
    fontSize: FontSize.xl + 2,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  guestSub: {
    color: T.textSub,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  guestPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.gold,
    paddingVertical: 15,
    borderRadius: 100,
    width: '100%',
    marginBottom: 12,
  },
  guestPrimaryText: {
    color: T.bg,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  guestSecondary: {
    paddingVertical: 14,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.cardBorder,
    marginBottom: 24,
  },
  guestSecondaryText: {
    color: T.textSub,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  guestFooter: {
    color: T.textMute,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  footerCross: {
    width: 20, height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    opacity: 0.4,
  },
  footerCrossV: {
    position: 'absolute',
    width: 2, height: 20,
    backgroundColor: T.gold,
    borderRadius: 1,
  },
  footerCrossH: {
    position: 'absolute',
    width: 14, height: 2,
    backgroundColor: T.gold,
    top: 5,
    borderRadius: 1,
  },
  footerText: {
    color: T.textMute,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  footerVersion: {
    color: T.textMute + '88',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});