import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
} from "@nextui-org/react";
import React, { useState } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { AuthAPI } from "../../api/auth";
import { toast } from "sonner";

const AuthModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { isAuthModalOpen, setIsAuthModalOpen, setUser } = useAuthStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data, error } =
      activeTab === "login"
        ? await AuthAPI.LoginRequest({
            username: formData.email,
            password: formData.password,
          })
        : await AuthAPI.RegisterRequest({
            username: formData.email,
            password: formData.password,
          });

    console.log("Error:", error, data);

    if (data) {
      toast.success(data.message);
      setUser(data.user);
      useAuthStore.setState({ isAuth: true });
      window.location.reload();
    }
    if (error) {
      toast.error("Invalid Credentials");
    }

    setLoading(false);
  };

  return (
    <>
      <Modal
        closeButton
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader>
            <h3>{activeTab === "login" ? "Login" : "Sign Up"}</h3>
          </ModalHeader>
          <ModalBody>
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              <Tab key="login" title="Login" />
              <Tab key="signup" title="Sign Up" />
            </Tabs>
            <Input
              fullWidth
              placeholder="Email"
              name="email"
              onChange={handleInputChange}
            />
            <Input
              fullWidth
              placeholder="Password"
              name="password"
              onChange={handleInputChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={handleSubmit}
              disabled={loading}
              className="bg-primary-50"
            >
              {loading
                ? "Loading..."
                : activeTab === "login"
                ? "Login"
                : "Sign Up"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AuthModal;
