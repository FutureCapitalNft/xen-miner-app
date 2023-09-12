import type { ThemeOptions } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material';
import { responsiveFontSizes } from '@mui/material/styles';
import { createContext, useEffect, useState } from 'react';

import { defaultTheme, overrides } from '@/styles/theme';

type TThemeContext = {
  mode: string;
  setMode: (m: string) => void;
  isLarge: boolean;
  isExtraLarge: boolean;
  safeRows: number;
  height: number;
};

const initialValue: TThemeContext = {
  mode: 'dark',
  setMode: (_: string) => {},
  isLarge: true,
  isExtraLarge: false,
  safeRows: 0,
  height: 0,
};

export const ThemeContext = createContext<TThemeContext>(initialValue);

export const FlexibleThemeProvider = ({ children }: any) => {
  const [mode, setMode] = useState('dark');
  const themeOptions = { ...defaultTheme, ...overrides('dark') } as ThemeOptions;
  const [theme, setTheme] = useState(createTheme(themeOptions));
  const [isLarge, setLarge] = useState(false);
  const [isExtraLarge, setExtraLarge] = useState(false);
  const [safeRows, setSafeRows] = useState(0);
  const [height, setHeight] = useState(0);

  const onScreenChange =
    (mql: MediaQueryList, mxql: MediaQueryList) =>
    // console.log('screen large', mql.matches)
    () => {
      setLarge(mql.matches);
      setExtraLarge(mxql.matches);
    };

  const large = '(min-width: 768px) and (orientation: landscape)';
  const extraLarge = '(min-width: 1280px) and (orientation: landscape)';

  const onDarkPrefChange = (query: MediaQueryList) => () => {
    setMode(query.matches ? 'dark' : 'light');
  };

  const flexibleTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode
    }
  };

  useEffect(() => {
    const userTheme = window.localStorage.getItem('theme');
    if (!userTheme) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.onchange = onDarkPrefChange(mq);
      onDarkPrefChange(mq)();
    } else {
      setMode(userTheme);
    }
    const mql = window.matchMedia(large);
    const mxql = window.matchMedia(extraLarge);
    onScreenChange(mql, mxql)();
    mql.onchange = onScreenChange(mql, mxql);

    if (safeRows === 0) {
      const rows = Math.ceil((window.innerHeight * 0.6 - 112) / 52);
      console.log('rows', rows, window.innerHeight);
      setSafeRows(rows);
      setHeight(window.innerHeight);
    }
  }, []);

  useEffect(() => {
    let newOptions = {
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        mode
      },
      ...overrides(mode)
    };
    if (mode === 'light') {
      newOptions = {
        ...newOptions,
        palette: {
          ...newOptions.palette,
          background: {
            default: mode === 'light' ? '#ededed' : '#121212'
          }
        }
      };
    }
    const newTheme = createTheme(newOptions as ThemeOptions);
    setTheme(responsiveFontSizes(newTheme));
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isLarge, isExtraLarge, safeRows, height }}>
      <ThemeProvider theme={flexibleTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
