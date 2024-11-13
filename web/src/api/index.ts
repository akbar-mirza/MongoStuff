export const API = "http://localhost:3001";

const Config = {
  headers: {
    "Content-Type": "application/json",
  },
};

export const Get = async <Resp, Err>(
  endpoint: string
): Promise<[Resp | null, Err | null]> => {
  const resp = await fetch(`${API}/${endpoint}`, Config);
  const data = await resp.json();

  if (!resp.ok) {
    return [null, data as Err];
  }

  return [data as Resp, null];
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
