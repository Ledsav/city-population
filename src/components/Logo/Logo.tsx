import { MARK_PATH, MARK_PATH_SMALL } from './markPaths';
import './Logo.css';

type LogoProps = {
  size?: number;
  wordmark?: boolean;
};

/** Halftone globe: dots on latitude rows, sized like a population map. */
export const LogoMark = ({ size = 32 }: { size?: number }) => (
  <svg className="logo-mark" width={size} height={size} viewBox="0 0 256 256" aria-hidden="true">
    <path d={size < 28 ? MARK_PATH_SMALL : MARK_PATH} />
  </svg>
);

export const Logo = ({ size = 32, wordmark = true }: LogoProps) => (
  <span className="logo" aria-label="PopGlobe">
    <LogoMark size={size} />
    {wordmark && <span className="logo-word">PopGlobe</span>}
  </span>
);
