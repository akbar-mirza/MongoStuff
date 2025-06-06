const IsDockerHost = process.env.NODE_ENV === "docker";
export const API = IsDockerHost ? "/api" : "http://localhost:27018/api";

export const GetCookie = (name: string) => {
  const cookie = document.cookie
    .replace(/\s/g, "")
    .split(";")
    .find((c) => c.startsWith(`${name}=`));
  return cookie?.split("=")[1];
};

export const ClearCookies = () => {
  document.cookie.split(";").forEach((cookie) => {
    const [name] = cookie.split("=");
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });
};

const Config = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials,
};

const SetConfig = (): RequestInit => {
  const csrfToken = GetCookie("csrf");
  return {
    ...Config,
    headers: {
      ...Config.headers,
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
  };
};

type TOptions = {
  Blob?: boolean;
};

export const Get = async <Resp, Err>(
  endpoint: string,
  options?: TOptions
): Promise<[Resp | null, Err | null, Headers | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, SetConfig());

  const data = options?.Blob ? await resp?.blob() : await resp?.json();

  if (!resp.ok) {
    return [null, data as Err, null];
  }
  if (options?.Blob) {
    return [data as Resp, null, resp.headers];
  }

  return [data as Resp, null, resp.headers];
};

export const Post = async <Req, Resp, Err extends { error: string }>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  try {
    const resp = await fetch(`${API}/${endpoint}`, {
      ...SetConfig(),
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await resp.json();

    if (!resp.ok) {
      return [null, data as Err];
    }

    return [data as Resp, null];
  } catch (_) {
    return [
      null,
      {
        error: "Something went wrong",
      } as Err,
    ];
  }
};

export type TErrorResp = {
  error: string;
};

export const Patch = async <Req, Resp, Err>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, {
    ...SetConfig(),
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
};

export const Delete = async <Req, Resp, Err>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, {
    ...SetConfig(),
    method: "DELETE",
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
};

export const Put = async <Req, Resp, Err>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, {
    ...SetConfig(),
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
};
