
type ApiOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  file?: File;
  headers?: HeadersInit;
}

export async function apiFetch<T>({
  path,
  method = 'GET',
  body,
  file,
  headers,
}: ApiOptions): Promise<T> {

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if(!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL이 설정되지 않았습니다');
  }

  const url = `${baseUrl}${path}`;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;

  if(file){
    const formData = new FormData();
    formData.append('file', file);

    if(body && typeof body === 'object'){
      for(const [key, value] of Object.entries(body)){
        if(value !== undefined && value !== null){
          formData.append(key, String(value));
        }
      }
    }

    requestBody = formData;
  }else if(body !== undefined){
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  requestHeaders.set('Accept', 'application/json');

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache: 'no-store',
  });

  if(!response.ok){
    const message = await response.text();
    throw new Error(message || `API 요청 실패 ${response.status}`)
  }

  if(response.status === 204){
    return undefined as T;
  }

  return  (await response.json()) as T;
  
}

