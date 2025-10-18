import { Frame, Navigation } from "@shopify/polaris";
import { HomeIcon, SettingsIcon, CreditCardIcon } from "@shopify/polaris-icons";
import { useNavigate, useLocation } from "react-router";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            items={[
              {
                url: "/app",
                label: "Home",
                icon: HomeIcon,
                onClick: () => navigate("/app"),
              },
              {
                url: "/app/settings",
                label: "Settings",
                icon: SettingsIcon,
                onClick: () => navigate("/app/settings"),
              },
              {
                url: "/app/billing",
                label: "Billing",
                icon: CreditCardIcon,
                onClick: () => navigate("/app/billing"),
              },
            ]}
          />
        </Navigation>
      }
    >
      {children}
    </Frame>
  );
}
