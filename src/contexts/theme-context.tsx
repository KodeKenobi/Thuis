import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

interface ThemeContextValue {
  theme: "light" | "dark";
  systemTheme: "light" | "dark";
  themePreference: TThemeType;
  setThemePreference: (preference: TThemeType) => Promise<void>;
}

const THEME_PREFERENCE_KEY = "APP_THEME_PREFERENCE";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const getSystemTheme = (): "light" | "dark" => {
    const sys = Appearance.getColorScheme();
    return sys === "dark" ? "dark" : "light";
  };

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme(),
  );
  const [themePreference, setThemePreferenceState] =
    useState<TThemeType>("system");
  const [theme, setTheme] = useState<"light" | "dark">(getSystemTheme());

  const applyTheme = (preference: TThemeType, sysTheme: "light" | "dark") => {
    if (preference === "system") {
      setTheme(sysTheme);
    } else {
      setTheme(preference);
    }
  };

  const loadThemePreference = async () => {
    try {
      const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      const pref: TThemeType =
        storedPreference === "light" ||
        storedPreference === "dark" ||
        storedPreference === "system"
          ? storedPreference
          : "system";
      setThemePreferenceState(pref);
      applyTheme(pref, getSystemTheme());
    } catch (e) {
      setThemePreferenceState("system");
      applyTheme("system", getSystemTheme());
    }
  };

  // Set up appearance change listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const newSystemTheme = colorScheme === "dark" ? "dark" : "light";
      setSystemTheme(newSystemTheme);

      if (themePreference === "system") {
        setTheme(newSystemTheme);
      }
    });

    return () => subscription.remove();
  }, [themePreference]);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Apply theme when preference changes
  useEffect(() => {
    applyTheme(themePreference, systemTheme);
  }, [themePreference, systemTheme]);

  const setThemePreference = async (preference: TThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
      setThemePreferenceState(preference);

      if (preference === "system") {
        setTheme(systemTheme);
      } else {
        setTheme(preference);
      }
    } catch (e) {}
  };

  return (
    <ThemeContext.Provider
      value={{ theme, systemTheme, themePreference, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
