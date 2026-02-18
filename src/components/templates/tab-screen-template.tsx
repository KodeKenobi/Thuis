import React, { ReactNode } from "react";
import InnerScreenTemplate from "./inner-screen-template";
import { HeaderProps } from "../ui/header";
import { DrawerTrigger } from "../ui/drawer";
import Avatar from "../ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface TabScreenTemplateProps {
  children?: ReactNode;
  headerAction?: ReactNode;
  header?: HeaderProps;
  scrollable?: boolean;
  scrollableName?: string;
  showHeaderAction?: boolean;
}

const TabScreenTemplate = ({
  children,
  headerAction,
  header,
  scrollable = false,
  scrollableName,
  showHeaderAction,
}: TabScreenTemplateProps) => {
  const { user } = useAuth();
  const { colors: { secondary, grayishColor } } = useCorporateBranding();

  return (
    <InnerScreenTemplate
      header={{
        left: (
          <DrawerTrigger>
            <Avatar
              fallback={user?.name}
              icon="person-outline"
              size={32}
              shape="square"
              backgroundColor={secondary}
              color={grayishColor}
            />
          </DrawerTrigger>
        ),
        ...header,
      }}
      headerAction={headerAction}
      scrollable={scrollable}
      scrollableName={scrollableName}
      showHeaderAction={showHeaderAction}
    >
      {children}
    </InnerScreenTemplate>
  );
};

export default TabScreenTemplate;
