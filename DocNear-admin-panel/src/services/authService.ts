import axios from 'axios';
import { request, setTokens, clearTokens } from './apiClient';

type Purpose = 'login' | 'register';
type Channel = 'sms' | 'telegram';
type Session = { access: string; refresh: string; user: { role: string; name: string } };

export const authService = {
  async requestOtp(phoneNumber: string, channel: Channel = 'sms', purpose: Purpose = 'login') {
    await request({url:'/auth/request-otp/',method:'POST',data:{phone_number:phoneNumber,purpose,channel}});
  },
  async verifyOtp(phoneNumber: string, code: string, purpose: Purpose = 'login') {
    try {
      const data=await request<Session>({url:'/auth/verify-otp/',method:'POST',data:{phone_number:phoneNumber,code,purpose}});
      if(!['admin','super_admin'].includes(data.user.role))throw new Error('Administrator hisobi talab qilinadi.');
      setTokens(data);return data.user;
    } catch(error) {
      if(axios.isAxiosError(error)&&!error.response)throw new Error('Backend bilan ulanib bo‘lmadi. API server 8001 portda ishlayotganini tekshiring.');
      throw error;
    }
  },
  logout(){clearTokens();},
  hasSession(){return !!sessionStorage.getItem('docnear_admin_access');},
};
