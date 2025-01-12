const IsDockerHost = process.env.NODE_ENV === "docker";
console.log("IsDockerHost", IsDockerHost);
export const API = IsDockerHost ? "/api" : "http://localhost:3001/api";

const Config = {
  headers: {
    "Content-Type": "application/json",
  },
};

type TOptions = {
  Blob?: boolean;
};

export const Get = async <Resp, Err>(
  endpoint: string,
  options?: TOptions
): Promise<[Resp | null, Err | null, Headers | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, Config);

  const data = options?.Blob ? await resp?.blob() : await resp?.json();

  if (!resp.ok) {
    return [null, data as Err, null];
  }
  if (options?.Blob) {
    return [data as Resp, null, resp.headers];
  }

  return [data as Resp, null, resp.headers];
};

export const Post = async <Req, Resp, Err>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, {
    ...Config,
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
};

export type TErrorResp = {
  error: string;
};

export const Patch = async <Req, Resp, Err>(
  endpoint: string,
  body: Req
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, {
    ...Config,
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
    ...Config,
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
    ...Config,
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
};
