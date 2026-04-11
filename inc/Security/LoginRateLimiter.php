<?php namespace cmk\RestApiFirewall\Security;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Firewall\IpFilter\IpEntryRepository;

/**
 * Login rate limiter — blocks brute-force login attempts by IP.
 *
 * Hooks:
 *   - authenticate (priority 5): reject requests from blocked IPs before
 *     WordPress checks credentials, saving a DB round-trip.
 *   - wp_login_failed (action): increment the failure counter; promote to a
 *     block transient when the threshold is reached.
 *
 * Transients:
 *   - rest_firewall_login_{16-char hash}         → failure count (TTL = window)
 *   - rest_firewall_login_blocked_{16-char hash} → blocked IP string (TTL = blacklist_time)
 *   - rest_firewall_login_strikes_{16-char hash} → block-cycle count (TTL = blacklist_time × promote_after+1)
 *
 * Escalation:
 *   When login_rate_limit_promote_after > 0, each completed block cycle increments
 *   a strike counter. Once strikes ≥ promote_after the IP is inserted into
 *   {prefix}_rest_api_firewall_ip_entries as list_type=global_blacklist with
 *   entry_type=rate_limit, visible and releasable from the IP Filter panel.
 *
 * Exemptions:
 *   - IPs present in the `absolute_whitelist` option (wordpress_mode group, pro).
 */
class LoginRateLimiter {

	public const  BLOCK_PREFIX  = 'rest_firewall_login_blocked_';
	public const  STRIKE_PREFIX = 'rest_firewall_login_strikes_';
	private const COUNT_PREFIX  = 'rest_firewall_login_';

	protected static ?self $instance = null;

	public static function get_instance(): self {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		// Priority 5 — before WordPress's default password check at priority 20.
		add_filter( 'authenticate', array( $this, 'check_before_auth' ), 5, 3 );
		add_action( 'wp_login_failed', array( $this, 'on_login_failed' ), 10, 2 );
	}

	// -------------------------------------------------------------------------
	// Hook callbacks
	// -------------------------------------------------------------------------

	/**
	 * Reject the login attempt early if the requesting IP is currently blocked.
	 *
	 * @param \WP_User|\WP_Error|null $user      Result from earlier authenticate callbacks.
	 * @param string                  $_username Submitted username (unused).
	 * @param string                  $_password Submitted password (unused).
	 * @return \WP_User|\WP_Error|null
	 */
	public function check_before_auth( $user, string $_username, string $_password ) {
		if ( ! $this->is_enabled() ) {
			return $user;
		}

		$ip = $this->get_client_ip();
		if ( '' === $ip || $this->is_whitelisted( $ip ) ) {
			return $user;
		}

		if ( get_transient( self::BLOCK_PREFIX . self::ip_hash( $ip ) ) ) {
			return new \WP_Error(
				'too_many_login_attempts',
				__( 'Too many failed login attempts. Please try again later.', 'rest-api-firewall' )
			);
		}

		return $user;
	}

	/**
	 * Increment the failure counter after a failed login attempt.
	 * Promotes to a block transient once the threshold is reached.
	 * Escalates to the global IP blacklist after N block cycles (if configured).
	 *
	 * @param string         $_username The username that failed authentication (unused).
	 * @param \WP_Error|null $_error    The WP_Error (WP 5.4+; null on older builds; unused).
	 */
	public function on_login_failed( string $_username, $_error = null ): void {
		if ( ! $this->is_enabled() ) {
			return;
		}

		$ip = $this->get_client_ip();
		if ( '' === $ip || $this->is_whitelisted( $ip ) ) {
			return;
		}

		$hash = self::ip_hash( $ip );

		// If check_before_auth already set a block (i.e., this failure was caused
		// by our own WP_Error), do not double-count it.
		if ( get_transient( self::BLOCK_PREFIX . $hash ) ) {
			return;
		}

		$opts      = $this->get_options();
		$count_key = self::COUNT_PREFIX . $hash;
		$count     = (int) get_transient( $count_key );
		++$count;

		if ( $count >= $opts['attempts'] ) {
			// Threshold reached: store the IP as the value (enables block listing in the UI).
			set_transient( self::BLOCK_PREFIX . $hash, $ip, $opts['blacklist_time'] );
			delete_transient( $count_key );

			// Escalation: promote to the shared global IP blacklist after N block cycles.
			if ( $opts['promote_after'] > 0 ) {
				$strike_key = self::STRIKE_PREFIX . $hash;
				$strikes    = (int) get_transient( $strike_key ) + 1;

				if ( $strikes >= $opts['promote_after'] ) {
					$this->promote_to_global_blacklist( $ip, $opts['blacklist_time'] );
					delete_transient( $strike_key );
				} else {
					// Keep strike counter alive across multiple block windows.
					set_transient( $strike_key, $strikes, $opts['blacklist_time'] * ( $opts['promote_after'] + 1 ) );
				}
			}
		} else {
			// Still accumulating — refresh the sliding window.
			set_transient( $count_key, $count, $opts['window'] );
		}
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private function is_enabled(): bool {
		return (bool) CoreOptions::read_option( 'login_rate_limit_enabled' );
	}

	/**
	 * Read and normalise the login rate-limiting options.
	 *
	 * @return array{ attempts: int, window: int, blacklist_time: int, promote_after: int }
	 */
	private function get_options(): array {
		$opts = CoreOptions::read_options();
		return array(
			'attempts'       => max( 1, (int) ( $opts['login_rate_limit_attempts'] ?? 5 ) ),
			'window'         => max( 1, (int) ( $opts['login_rate_limit_window'] ?? 300 ) ),
			'blacklist_time' => max( 1, (int) ( $opts['login_rate_limit_blacklist_time'] ?? 3600 ) ),
			'promote_after'  => max( 0, (int) ( $opts['login_rate_limit_promote_after'] ?? 0 ) ),
		);
	}

	/**
	 * Derive a short, stable transient key segment from an IP address.
	 * Public + static so LoginBlockService can use it without duplicating the logic.
	 */
	public static function ip_hash( string $ip ): string {
		return substr( hash( 'sha256', $ip ), 0, 16 );
	}

	/**
	 * Insert the IP into the shared global_blacklist DB table (free + pro).
	 * Skips if the IP is already in the list to avoid duplicate-key errors.
	 */
	private function promote_to_global_blacklist( string $ip, int $duration ): void {
		if ( ! class_exists( IpEntryRepository::class ) ) {
			return;
		}

		// Avoid duplicate entries (UNIQUE KEY ip + list_type).
		if ( IpEntryRepository::ip_in_list( $ip, 'global_blacklist' ) ) {
			return;
		}

		IpEntryRepository::insert(
			array(
				'ip'         => $ip,
				'list_type'  => 'global_blacklist',
				'entry_type' => 'rate_limit',
				'expires_at' => gmdate( 'Y-m-d H:i:s', time() + $duration ),
			)
		);
	}

	/**
	 * Returns true when $ip matches any entry in the `absolute_whitelist` option.
	 * Empty entries (invalid IPs filtered by sanitize_ip_array) are skipped.
	 */
	private function is_whitelisted( string $ip ): bool {
		$whitelist = array_filter( (array) CoreOptions::read_option( 'absolute_whitelist' ) );

		foreach ( $whitelist as $entry ) {
			if ( $this->ip_matches( $ip, (string) $entry ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Test whether $ip matches a single whitelist entry (plain IP or CIDR).
	 * Works for both IPv4 and IPv6 using byte-level comparison via inet_pton().
	 */
	private function ip_matches( string $ip, string $entry ): bool {
		// Plain IP — exact match.
		if ( strpos( $entry, '/' ) === false ) {
			return $ip === $entry;
		}

		[ $network, $prefix ] = explode( '/', $entry, 2 );
		$prefix               = (int) $prefix;
		$ip_bin               = inet_pton( $ip );
		$net_bin              = inet_pton( $network );

		// Both must be valid and the same address family.
		if ( false === $ip_bin || false === $net_bin || strlen( $ip_bin ) !== strlen( $net_bin ) ) {
			return false;
		}

		if ( $prefix <= 0 ) {
			return true; // /0 matches everything.
		}

		$max_bits    = strlen( $ip_bin ) * 8;
		$prefix      = min( $prefix, $max_bits );
		$full_bytes  = intdiv( $prefix, 8 );
		$remain_bits = $prefix % 8;

		// Compare the unambiguous full bytes.
		if ( $full_bytes > 0 && substr( $ip_bin, 0, $full_bytes ) !== substr( $net_bin, 0, $full_bytes ) ) {
			return false;
		}

		// Compare the partial byte at the boundary (if any).
		if ( $remain_bits > 0 ) {
			$mask = 0xFF & ( 0xFF << ( 8 - $remain_bits ) );
			if ( ( ord( $ip_bin[ $full_bytes ] ) & $mask ) !== ( ord( $net_bin[ $full_bytes ] ) & $mask ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Detect the real client IP.
	 *
	 * Priority order: Cloudflare → X-Real-IP → X-Forwarded-For (leftmost) → REMOTE_ADDR.
	 * IPv4-mapped IPv6 addresses (::ffff:1.2.3.4) are normalised to plain IPv4.
	 */
	private function get_client_ip(): string {
		$candidates = array(
			sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '' ) ),
			sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_REAL_IP'] ?? '' ) ),
			// X-Forwarded-For may contain a comma-separated list; take the first (client) entry.
			trim( explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '' ) ) )[0] ),
			sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) ),
		);

		foreach ( $candidates as $ip ) {
			$ip = trim( $ip );
			if ( '' === $ip || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
				continue;
			}

			// Normalise IPv4-mapped IPv6 (::ffff:1.2.3.4) → plain IPv4.
			if ( strpos( strtolower( $ip ), '::ffff:' ) === 0 ) {
				$v4 = substr( $ip, 7 );
				if ( filter_var( $v4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
					return $v4;
				}
			}

			return $ip;
		}

		return '';
	}
}
