import { Delete, Get, Post } from ".";

type User = {
  username: string;
  userID: string;
  sessionToken: string;
  csrfToken: string;
};

type LoginParams = {
  username: string;
  password: string;
};

const LoginRequest = async (params: LoginParams) => {
  const [data, error] = await Post<
    LoginParams,
    {
      user: User;
      message: string;
    },
    {
      error: string;
    }
  >("auth/login", params);
  return { data, error };
};

const RegisterRequest = async (params: LoginParams) => {
  const [data, error] = await Post<
    LoginParams,
    {
      message: string;
      user: User;
    },
    {
      error: string;
    }
  >("auth/register", params);
  return { data, error };
};

const CurretUserRequest = async () => {
  const [user, error] = await Get<
    {
      user: User;
    },
    {
      error: string;
    }
  >("auth/current");
  return { user, error };
};

const LogoutRequest = async () => {
  const [user, error] = await Delete<unknown, unknown, unknown>(
    "auth/logout",
    {}
  );
  return { user, error };
};

export const AuthAPI = {
  LoginRequest,
  RegisterRequest,
  CurretUserRequest,
  LogoutRequest,
};
