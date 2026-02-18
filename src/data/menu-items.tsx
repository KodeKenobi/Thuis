import Ionicons from "@expo/vector-icons/Ionicons";

export const MENU_ITEMS = [
  {
    label: "Account",
    path: "/account-screen",
    icon: <Ionicons name="person-outline" />,
    sort: 1,
  },
  {
    label: "Reparaties",
    path: "/repairs-screen",
    icon: <Ionicons name="construct-outline"/>,
    sort: 2,
  },
  {
    label: "Betalen",
    path: "/financial/financial-screen",
    icon: <Ionicons name="cash-outline" />,
    sort: 3,
  },
  {
    label: "Contract",
    path: "/contracts/contracts-screen",
    icon: <Ionicons name="document-text-outline"/>,
    sort: 4,
  },
  {
    label: "Contact",
    path: "/contact-screen",
    icon: <Ionicons name="headset-outline"/>,
    sort: 5,
  },
  {
    label: "Instellingen",
    path: "/settings/settings-screen",
    icon: <Ionicons name="settings-outline" />,
    sort: 6,
  },
];
