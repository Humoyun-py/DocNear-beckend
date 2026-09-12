import axios from 'axios';
export const apiClient = axios.create({baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1', timeout: 20000});
export function clearSession() {
 sessionStorage.removeItem('docnear_doctor_token'); sessionStorage.removeItem('docnear_doctor_refresh');
 localStorage.removeItem('docnear_doctor_token'); localStorage.removeItem('docnear_doctor_refresh');
 window.dispatchEvent(new Event('docnear:doctor-expired'));
}
apiClient.interceptors.request.use(config => {
 const token = sessionStorage.getItem('docnear_doctor_token');
 if (token && !/\/auth\/(login|register|request-otp|resend-otp|verify-otp|token\/refresh)\//.test(config.url || '')) config.headers.Authorization = 'Bearer ' + token;
 return config;
});
let refreshPromise: Promise<void> | null = null;
apiClient.interceptors.response.use(response => {
 if (response.status !== 204) {
  if (response.data?.success !== true) throw new Error('API javobi noto‘g‘ri');
  response.data = response.data.data;
 }
 return response;
}, async error => {
 const original = error.config;
 if (error.response?.status === 401 && original && !/\/auth\/(login|register|request-otp|resend-otp|verify-otp|token\/refresh)\//.test(original.url || '')) {
  if (!original._retry && sessionStorage.getItem('docnear_doctor_refresh')) {
   original._retry = true;
   if (!refreshPromise) refreshPromise = axios.post(apiClient.defaults.baseURL + '/auth/token/refresh/', {refresh: sessionStorage.getItem('docnear_doctor_refresh')}, {timeout: 20000})
    .then(response => {
     const data = response.data.data;
     sessionStorage.setItem('docnear_doctor_token', data.access);
     if (data.refresh) sessionStorage.setItem('docnear_doctor_refresh', data.refresh);
    }).finally(() => { refreshPromise = null; });
   let refreshed = false;
   try { await refreshPromise; refreshed = true; }
   catch (refreshError) {
    if (axios.isAxiosError(refreshError) && (!refreshError.response || refreshError.response.status >= 500)) throw refreshError;
   }
   if (refreshed) return apiClient(original);
  }
  clearSession();
 }
 error.message = error.response?.data?.message || error.message;
 if (error.response?.data?.errors) error.message += ': ' + JSON.stringify(error.response.data.errors);
 throw error;
});
export async function apiList<T>(path: string, params: Record<string,string> = {}): Promise<T[]> {
 const results: T[] = []; let page = 1;
 for (;;) {
  const {data} = await apiClient.get(path, {params: {...params, page_size: 100, page: page++}});
  results.push(...data.results);
  if (!data.next) return results;
 }
}
