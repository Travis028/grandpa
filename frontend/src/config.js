import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
});

export const apiCache = {
  data: {},
  get: async function(url) {
    if (this.data[url]) {
      api.get(url).then(res => this.data[url] = res).catch(()=>{});
      return this.data[url];
    }
    const res = await api.get(url);
    this.data[url] = res;
    return res;
  },
  clear: function(url) {
    if (url) delete this.data[url];
    else this.data = {};
  }
};

export default api;
