import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";
import { AuthAPI } from "../api/auth";
import { useAuthStore } from "../stores/auth.store";

export default function TopNavbar() {
  const { user } = useAuthStore();
  return (
    <Navbar maxWidth="full">
      <NavbarBrand>
        <Link href="/" color="foreground" className="flex gap-1">
          <Avatar src="/mongostuff.svg" alt="Logo" size="sm" />
          <p className="text-lg font-bold text-inherit">
            Mongo
            <span className="font-mono text-primary">Stuff</span>
          </p>
        </Link>
      </NavbarBrand>

      {/* <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link color="foreground" href="#">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="#" aria-current="page" color="secondary">
            Customers
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            Integrations
          </Link>
        </NavbarItem>
      </NavbarContent> */}

      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name={user?.username}
              size="sm"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="gap-2 h-14">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{user?.username}</p>
            </DropdownItem>
            {/* <DropdownItem key="settings">My Settings</DropdownItem>
            <DropdownItem key="team_settings">Team Settings</DropdownItem>
            <DropdownItem key="analytics">Analytics</DropdownItem>
            <DropdownItem key="system">System</DropdownItem>
            <DropdownItem key="configurations">Configurations</DropdownItem>
            <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem> */}
            <DropdownItem
              key="logout"
              color="danger"
              onClick={async () => {
                await AuthAPI.LogoutRequest();
                // remove all cookies
                document.cookie.split(";").forEach((cookie) => {
                  const [name] = cookie.split("=");
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
                });
                window.location.reload();
              }}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
