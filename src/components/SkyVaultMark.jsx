/* SkyVault logo mark — a rounded vault/shield silhouette containing a sky arc and sun,
   representing "trusted, secured forecasting." The hexagonal vault shape reads as
   a seal of reliability; the arc + sun inside reads as sky/weather. */
export default function SkyVaultMark({ size = 32, animated = false }) {
  const id = 'sv';
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.3)) drop-shadow(0 0 16px rgba(91,156,246,.20))',
      position: 'relative',
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`${id}-shell`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a2548" />
            <stop offset="100%" stopColor="#0c1226" />
          </linearGradient>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7fc3ff" />
            <stop offset="100%" stopColor="#5b9cf6" />
          </linearGradient>
          <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Vault shell — hexagonal seal shape, the "trust" container */}
        <path
          d="M 50 4
             L 90 25
             L 90 62
             Q 90 70 83 75
             L 53 95
             Q 50 97 47 95
             L 17 75
             Q 10 70 10 62
             L 10 25
             Z"
          fill={`url(#${id}-shell)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2"
        />

        {/* Inner bevel ring for depth */}
        <path
          d="M 50 12
             L 82 29
             L 82 60
             Q 82 66 77 70
             L 51 87
             Q 50 88 49 87
             L 23 70
             Q 18 66 18 60
             L 18 29
             Z"
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeWidth="1.5"
        />

        {/* Sky arc inside the vault */}
        <path
          d="M 28 58 A 24 24 0 0 1 72 58"
          fill="none"
          stroke={`url(#${id}-sky)`}
          strokeWidth="5"
          strokeLinecap="round"
          className={animated ? 'skyvault-horizon' : ''}
        />

        {/* Sun disc */}
        <circle cx="50" cy="42" r="11" fill={`url(#${id}-sun)`} className={animated ? 'skyvault-sun' : ''} />

        {/* Vault keyhole accent at the base — reinforces "secured" without being literal */}
        <circle cx="50" cy="78" r="3" fill="rgba(255,255,255,.55)" />
      </svg>
    </div>
  );
}
