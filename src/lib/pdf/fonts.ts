import { Font } from '@react-pdf/renderer';
import path from 'path';

// Guard so Font.register() only runs once even if this module is imported multiple times.
// @react-pdf/renderer Font.register is idempotent by family name, but the guard avoids
// repeated filesystem reads in tests.
let registered = false;

export function registerFonts(): void {
  if (registered) return;
  registered = true;

  const base = path.join(process.cwd(), 'public', 'fonts', 'liberation');

  Font.register({
    family: 'LiberationSans',
    fonts: [
      { src: path.join(base, 'LiberationSans-Regular.ttf') },
      { src: path.join(base, 'LiberationSans-Bold.ttf'), fontWeight: 'bold' },
    ],
  });
}
