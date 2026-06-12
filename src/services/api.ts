import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, UserInfo, MailListMode } from '../types';

const BASE_URL_KEY = 'base_url';

export async function getBaseUrl(): Promise<string | null> {
  return AsyncStorage.getItem(BASE_URL_KEY);
}

export async function setBaseUrl(url: string): Promise<void> {
  const cleaned = url.replace(/\/+$/, '');
  await AsyncStorage.setItem(BASE_URL_KEY, cleaned);
}

// XMLHttpRequestを使ったリクエスト（CORSの影響を受けない）
function xhrRequest(
  url: string,
  method: string,
  body?: string,
  headers?: Record<string, string>,
): Promise<{ status: number; contentType: string; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;

    if (headers) {
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    }

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        contentType: xhr.getResponseHeader('content-type') || '',
        text: xhr.responseText,
      });
    };
    xhr.onerror = () => reject(new Error('FETCH_ERROR: network error'));
    xhr.ontimeout = () => reject(new Error('FETCH_ERROR: timeout'));
    xhr.timeout = 15000;

    xhr.send(body || null);
  });
}

async function request<T>(
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const base = await getBaseUrl();
  if (!base) throw new Error('BASE_URL_NOT_SET');

  let url = `${base}${path}`;
  let body: string | undefined;
  const headers: Record<string, string> = {};

  if (method === 'POST' && params) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  } else if (method === 'GET' && params) {
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    url = `${url}?${qs}`;
  }

  let res: { status: number; contentType: string; text: string };
  try {
    res = await xhrRequest(url, method, body, headers);
  } catch (e: any) {
    throw new Error('FETCH_ERROR: ' + (e.message || String(e)));
  }

  if (!res.contentType.includes('application/json') && !res.contentType.includes('text/javascript')) {
    throw new Error(
      'UNEXPECTED_RESPONSE\nstatus=' + res.status +
      '\ncontentType=' + res.contentType +
      '\nbody=' + res.text.substring(0, 100)
    );
  }

  const json = JSON.parse(res.text);
  if (json.error === 'NOTLOGGEDIN') {
    throw new Error('NOTLOGGEDIN');
  }
  return json as T;
}

export async function login(loginid: string, password: string): Promise<'ok' | 'ng' | 'lock'> {
  const result = await request<{ result: string }>('/apilogin', { loginid, password });
  return result.result as 'ok' | 'ng' | 'lock';
}

export async function logout(): Promise<void> {
  try {
    await request<{ result: string }>('/logout/apilogout', undefined, 'POST');
  } catch (_) {}
}

export async function getUserInfo(): Promise<UserInfo> {
  return request<UserInfo>('/user/apiinfo', undefined, 'GET');
}

export async function getInboxNew(): Promise<Mail[]> {
  return request<Mail[]>('/mail/apiinbox', undefined, 'GET');
}

export async function getMailList(mode: MailListMode, page: number = 1): Promise<Mail[]> {
  return request<Mail[]>('/mail/apilist', { mode, page: String(page) }, 'GET');
}

export async function getMail(userId: string, mailId: string): Promise<Mail> {
  return request<Mail>('/mail/apiview', { id: userId, mailid: mailId }, 'GET');
}

export async function sendMail(params: {
  id: string;
  subject: string;
  body: string;
  mailid?: string;
  photoid?: string;
}): Promise<void> {
  const p: Record<string, string> = {
    id: params.id,
    subject: params.subject,
    body: params.body,
  };
  if (params.mailid) p.mailid = params.mailid;
  if (params.photoid) p.photoid = params.photoid;

  const res = await request<{ result?: string; error?: string; message?: string }>(
    '/send/apipost',
    p,
  );
  if (res.error) throw new Error(res.message || res.error);
}